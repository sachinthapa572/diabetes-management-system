import { endOfWeek, format, startOfWeek, subDays } from "date-fns";
import prisma from "../../prisma/db";
import { emailService } from "./emailService";

interface WeeklyReportData {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  unacknowledgedAlerts: {
    id: string;
    alert_type: string;
    message: string;
    created_at: Date;
    glucose_level: number;
    context: string;
    reading_timestamp: Date;
  }[];
  weeklyStats: {
    totalAlerts: number;
    highGlucoseAlerts: number;
    lowGlucoseAlerts: number;
    averageGlucose: number;
    totalReadings: number;
    alertRate: number; // percentage of readings that triggered alerts
  };
  alertConfig: {
    high_threshold: number;
    low_threshold: number;
    notification_emails: string[];
  };
}

class WeeklyReportService {
  async generateAndSendWeeklyReports(): Promise<void> {
    try {
      console.log("Starting weekly alert report generation...");

      // Get all users with enabled alert configurations and unacknowledged alerts
      const usersWithAlerts = await this.getUsersWithUnacknowledgedAlerts();

      console.log(
        `Found ${usersWithAlerts.length} users with unacknowledged alerts`
      );

      for (const userId of usersWithAlerts) {
        try {
          await this.generateAndSendUserReport(userId);
        } catch (error) {
          console.error(`Failed to generate report for user ${userId}:`, error);
        }
      }

      console.log("Weekly alert report generation completed");
    } catch (error) {
      console.error("Failed to generate weekly reports:", error);
    }
  }

  private async getUsersWithUnacknowledgedAlerts(): Promise<string[]> {
    const oneWeekAgo = subDays(new Date(), 7);

    const users = await prisma.user.findMany({
      where: {
        alertConfigs: {
          some: {
            enabled: true,
          },
        },
        alertHistory: {
          some: {
            acknowledged: false,
            created_at: {
              gte: oneWeekAgo,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    return users.map((user) => user.id);
  }

  private async generateAndSendUserReport(userId: string): Promise<void> {
    const reportData = await this.generateUserReportData(userId);

    if (!reportData || reportData.unacknowledgedAlerts.length === 0) {
      return; // No unacknowledged alerts, skip report
    }

    await this.sendWeeklyReportEmail(reportData);
    console.log(`Weekly report sent to ${reportData.user.email}`);
  }

  private async generateUserReportData(
    userId: string
  ): Promise<WeeklyReportData | null> {
    const oneWeekAgo = subDays(new Date(), 7);
    const weekStart = startOfWeek(oneWeekAgo);
    const weekEnd = endOfWeek(new Date());

    // Get user with alert config
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        alertConfigs: {
          where: { enabled: true },
        },
      },
    });

    if (!user || !user.alertConfigs[0]) {
      return null;
    }

    const alertConfig = user.alertConfigs[0];

    // Get unacknowledged alerts from the past week
    const unacknowledgedAlerts = await prisma.alertHistory.findMany({
      where: {
        user_id: userId,
        acknowledged: false,
        created_at: {
          gte: oneWeekAgo,
        },
      },
      include: {
        reading: {
          select: {
            glucose_level: true,
            context: true,
            timestamp: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Get weekly statistics
    const weeklyReadings = await prisma.reading.findMany({
      where: {
        user_id: userId,
        timestamp: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    const weeklyAlerts = await prisma.alertHistory.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    const glucoseLevels = weeklyReadings.map((r) => r.glucose_level);
    const averageGlucose =
      glucoseLevels.length > 0
        ? glucoseLevels.reduce((a, b) => a + b, 0) / glucoseLevels.length
        : 0;

    const weeklyStats = {
      totalAlerts: weeklyAlerts.length,
      highGlucoseAlerts: weeklyAlerts.filter(
        (a) => a.alert_type === "HIGH_GLUCOSE"
      ).length,
      lowGlucoseAlerts: weeklyAlerts.filter(
        (a) => a.alert_type === "LOW_GLUCOSE"
      ).length,
      averageGlucose: Math.round(averageGlucose * 100) / 100,
      totalReadings: weeklyReadings.length,
      alertRate:
        weeklyReadings.length > 0
          ? Math.round(
              (weeklyAlerts.length / weeklyReadings.length) * 100 * 100
            ) / 100
          : 0,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      unacknowledgedAlerts: unacknowledgedAlerts.map((alert) => ({
        id: alert.id,
        alert_type: alert.alert_type,
        message: alert.message,
        created_at: alert.created_at,
        glucose_level: alert.reading?.glucose_level || 0,
        context: alert.reading?.context || "OTHER",
        reading_timestamp: alert.reading?.timestamp || alert.created_at,
      })),
      weeklyStats,
      alertConfig: {
        high_threshold: alertConfig.high_threshold,
        low_threshold: alertConfig.low_threshold,
        notification_emails: alertConfig.notification_emails,
      },
    };
  }

  private async sendWeeklyReportEmail(
    reportData: WeeklyReportData
  ): Promise<void> {
    const { user, unacknowledgedAlerts, weeklyStats, alertConfig } = reportData;

    const subject = `📊 Weekly Glucose Alert Report - ${
      unacknowledgedAlerts.length
    } Unacknowledged Alert${unacknowledgedAlerts.length !== 1 ? "s" : ""}`;

    const htmlContent = this.generateWeeklyReportHTML(reportData);
    const textContent = this.generateWeeklyReportText(reportData);

    // Send to all configured notification emails
    const recipients = alertConfig.notification_emails;

    await emailService.sendEmail({
      to: recipients,
      subject,
      html: htmlContent,
      text: textContent,
    });
  }

  private generateWeeklyReportHTML(data: WeeklyReportData): string {
    const { user, unacknowledgedAlerts, weeklyStats, alertConfig } = data;
    const weekStart = format(
      startOfWeek(subDays(new Date(), 7)),
      "MMM dd, yyyy"
    );
    const weekEnd = format(endOfWeek(new Date()), "MMM dd, yyyy");

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Glucose Alert Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px; }
        .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; }
        .card-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .card-label { color: #6c757d; font-size: 0.9em; }
        .alert-high .card-value { color: #dc3545; }
        .alert-low .card-value { color: #ffc107; }
        .alert-total .card-value { color: #6f42c1; }
        .glucose-avg .card-value { color: #28a745; }
        .alert-item { background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .alert-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .alert-type { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .alert-high { background: #f8d7da; color: #721c24; }
        .alert-low { background: #fff3cd; color: #856404; }
        .alert-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .detail-item { text-align: center; }
        .detail-value { font-weight: bold; font-size: 1.1em; }
        .detail-label { color: #6c757d; font-size: 0.9em; }
        .thresholds { background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .threshold-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 0.9em; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .no-alerts { text-align: center; padding: 40px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Weekly Glucose Alert Report</h1>
            <p>${user.first_name} ${user.last_name}</p>
            <p>${weekStart} - ${weekEnd}</p>
        </div>

        <div class="content">
            <!-- Weekly Summary -->
            <h2>📈 Weekly Summary</h2>
            <div class="summary-cards">
                <div class="card alert-total">
                    <div class="card-value">${weeklyStats.totalAlerts}</div>
                    <div class="card-label">Total Alerts</div>
                </div>
                <div class="card alert-high">
                    <div class="card-value">${
                      weeklyStats.highGlucoseAlerts
                    }</div>
                    <div class="card-label">High Glucose</div>
                </div>
                <div class="card alert-low">
                    <div class="card-value">${
                      weeklyStats.lowGlucoseAlerts
                    }</div>
                    <div class="card-label">Low Glucose</div>
                </div>
                <div class="card glucose-avg">
                    <div class="card-value">${weeklyStats.averageGlucose}</div>
                    <div class="card-label">Avg Glucose (mg/dL)</div>
                </div>
            </div>

            <div class="summary-cards">
                <div class="card">
                    <div class="card-value">${weeklyStats.totalReadings}</div>
                    <div class="card-label">Total Readings</div>
                </div>
                <div class="card">
                    <div class="card-value">${weeklyStats.alertRate}%</div>
                    <div class="card-label">Alert Rate</div>
                </div>
            </div>

            <!-- Current Thresholds -->
            <div class="thresholds">
                <h3>⚙️ Current Alert Thresholds</h3>
                <div class="threshold-grid">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #dc3545;">${
                          alertConfig.high_threshold
                        } mg/dL</div>
                        <div style="color: #6c757d;">High Threshold</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #ffc107;">${
                          alertConfig.low_threshold
                        } mg/dL</div>
                        <div style="color: #6c757d;">Low Threshold</div>
                    </div>
                </div>
            </div>

            <!-- Unacknowledged Alerts -->
            <h2>🚨 Unacknowledged Alerts (${unacknowledgedAlerts.length})</h2>

            ${
              unacknowledgedAlerts.length === 0
                ? `
                <div class="no-alerts">
                    <p>🎉 Great news! No unacknowledged alerts this week.</p>
                </div>
            `
                : unacknowledgedAlerts
                    .map(
                      (alert) => `
                <div class="alert-item">
                    <div class="alert-header">
                        <h3>${alert.message}</h3>
                        <span class="alert-type ${
                          alert.alert_type === "HIGH_GLUCOSE"
                            ? "alert-high"
                            : "alert-low"
                        }">
                            ${alert.alert_type.replace("_", " ")}
                        </span>
                    </div>
                    <div class="alert-details">
                        <div class="detail-item">
                            <div class="detail-value">${
                              alert.glucose_level
                            } mg/dL</div>
                            <div class="detail-label">Glucose Level</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-value">${this.formatContext(
                              alert.context
                            )}</div>
                            <div class="detail-label">Context</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-value">${format(
                              alert.reading_timestamp,
                              "MMM dd"
                            )}</div>
                            <div class="detail-label">Date</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-value">${format(
                              alert.reading_timestamp,
                              "HH:mm"
                            )}</div>
                            <div class="detail-label">Time</div>
                        </div>
                    </div>
                </div>
            `
                    )
                    .join("")
            }

            <div class="warning">
                <strong>⚠️ Action Required:</strong> Please review and acknowledge these alerts in your Blood Sugar Monitor dashboard.
                If you're experiencing frequent alerts, consider consulting with your healthcare provider about adjusting your thresholds or treatment plan.
            </div>
        </div>

        <div class="footer">
            <p>This weekly report was generated automatically by the Blood Sugar Monitor system.</p>
            <p>Report generated on ${format(
              new Date(),
              "MMM dd, yyyy 'at' HH:mm"
            )}</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateWeeklyReportText(data: WeeklyReportData): string {
    const { user, unacknowledgedAlerts, weeklyStats, alertConfig } = data;
    const weekStart = format(
      startOfWeek(subDays(new Date(), 7)),
      "MMM dd, yyyy"
    );
    const weekEnd = format(endOfWeek(new Date()), "MMM dd, yyyy");

    return `
WEEKLY GLUCOSE ALERT REPORT
${user.first_name} ${user.last_name}
${weekStart} - ${weekEnd}

WEEKLY SUMMARY
==============
Total Alerts: ${weeklyStats.totalAlerts}
High Glucose Alerts: ${weeklyStats.highGlucoseAlerts}
Low Glucose Alerts: ${weeklyStats.lowGlucoseAlerts}
Average Glucose: ${weeklyStats.averageGlucose} mg/dL
Total Readings: ${weeklyStats.totalReadings}
Alert Rate: ${weeklyStats.alertRate}%

CURRENT THRESHOLDS
==================
High Threshold: ${alertConfig.high_threshold} mg/dL
Low Threshold: ${alertConfig.low_threshold} mg/dL

UNACKNOWLEDGED ALERTS (${unacknowledgedAlerts.length})
========================
${
  unacknowledgedAlerts.length === 0
    ? "Great news! No unacknowledged alerts this week."
    : unacknowledgedAlerts
        .map(
          (alert) => `
- ${alert.message}
  Glucose: ${alert.glucose_level} mg/dL
  Context: ${this.formatContext(alert.context)}
  Date: ${format(alert.reading_timestamp, "MMM dd, yyyy HH:mm")}
  Type: ${alert.alert_type.replace("_", " ")}
`
        )
        .join("")
}

⚠️ ACTION REQUIRED: Please review and acknowledge these alerts in your Blood Sugar Monitor dashboard.

This weekly report was generated automatically by the Blood Sugar Monitor system.
Report generated on ${format(new Date(), "MMM dd, yyyy 'at' HH:mm")}
Please do not reply to this email.
`;
  }

  private formatContext(context: string): string {
    const contextMap: Record<string, string> = {
      FASTING: "Fasting",
      PRE_MEAL: "Before Meal",
      POST_MEAL: "After Meal",
      EXERCISE: "During Exercise",
      OTHER: "Other",
    };
    return contextMap[context] || context;
  }
}

export const weeklyReportService = new WeeklyReportService();
