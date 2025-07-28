import appEnv from "@/validation/env.ts";
import nodemailer, { createTransport } from "nodemailer";

interface AlertEmailData {
  userEmail: string;
  userName: string;
  glucoseLevel: number;
  alertType: "HIGH_GLUCOSE" | "LOW_GLUCOSE";
  timestamp: Date;
  context: string;
  thresholds: {
    high: number;
    low: number;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = createTransport({
      host: appEnv.SMTP_HOST,
      port: Number(appEnv.SMTP_PORT),
      // secure: false,
      auth: {
        user: appEnv.SMTP_USER,
        pass: appEnv.SMTP_PASS,
      },
    });
  }

  async sendAlertEmail(
    recipients: string[],
    alertData: AlertEmailData
  ): Promise<void> {
    try {
      const {
        userName,
        glucoseLevel,
        alertType,
        timestamp,
        context,
        thresholds,
      } = alertData;

      const isHighAlert = alertType === "HIGH_GLUCOSE";
      const alertTypeText = isHighAlert ? "High Glucose" : "Low Glucose";
      const alertColor = isHighAlert ? "#dc2626" : "#d97706"; // red-600 : amber-600
      const thresholdText = isHighAlert
        ? `above ${thresholds.high} mg/dL`
        : `below ${thresholds.low} mg/dL`;

      const subject = `🚨 ${alertTypeText} Alert - ${glucoseLevel} mg/dL`;

      const htmlContent = this.generateAlertEmailHTML({
        userName,
        glucoseLevel,
        alertType: alertTypeText,
        alertColor,
        thresholdText,
        timestamp,
        context: this.formatContext(context),
        thresholds,
      });

      const textContent = this.generateAlertEmailText({
        userName,
        glucoseLevel,
        alertType: alertTypeText,
        thresholdText,
        timestamp,
        context: this.formatContext(context),
      });

      await this.transporter.sendMail({
        from: `"Blood Sugar Monitor" <${process.env.SMTP_USER}>`,
        to: recipients.join(", "),
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(
        `Alert email sent to ${recipients.length} recipients for ${alertTypeText} alert`
      );
    } catch (error) {
      console.error("Failed to send alert email:", error);
      throw error;
    }
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

  private generateAlertEmailHTML(data: {
    userName: string;
    glucoseLevel: number;
    alertType: string;
    alertColor: string;
    thresholdText: string;
    timestamp: Date;
    context: string;
    thresholds: { high: number; low: number };
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Glucose Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .alert-box { background: ${
          data.alertColor
        }; color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .glucose-level { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #495057; }
        .value { color: #6c757d; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 0.9em; color: #6c757d; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🩸 Blood Sugar Monitor</h1>
            <p>Glucose Level Alert Notification</p>
        </div>

        <div class="alert-box">
            <h2>⚠️ ${data.alertType} Alert</h2>
            <div class="glucose-level">${data.glucoseLevel} mg/dL</div>
            <p>Glucose level is ${data.thresholdText}</p>
        </div>

        <div class="details">
            <h3>Reading Details</h3>
            <div class="detail-row">
                <span class="label">Patient:</span>
                <span class="value">${data.userName}</span>
            </div>
            <div class="detail-row">
                <span class="label">Date & Time:</span>
                <span class="value">${data.timestamp.toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="label">Context:</span>
                <span class="value">${data.context}</span>
            </div>
            <div class="detail-row">
                <span class="label">High Threshold:</span>
                <span class="value">${data.thresholds.high} mg/dL</span>
            </div>
            <div class="detail-row">
                <span class="label">Low Threshold:</span>
                <span class="value">${data.thresholds.low} mg/dL</span>
            </div>
        </div>

        <div class="warning">
            <strong>⚠️ Important:</strong> This is an automated alert. If this is a medical emergency, please contact emergency services immediately or consult with your healthcare provider.
        </div>

        <div class="footer">
            <p>This email was sent automatically by the Blood Sugar Monitor system.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateAlertEmailText(data: {
    userName: string;
    glucoseLevel: number;
    alertType: string;
    thresholdText: string;
    timestamp: Date;
    context: string;
  }): string {
    return `
GLUCOSE ALERT NOTIFICATION

⚠️ ${data.alertType} Alert

Patient: ${data.userName}
Glucose Level: ${data.glucoseLevel} mg/dL
Status: Glucose level is ${data.thresholdText}
Date & Time: ${data.timestamp.toLocaleString()}
Context: ${data.context}

⚠️ IMPORTANT: This is an automated alert. If this is a medical emergency, please contact emergency services immediately or consult with your healthcare provider.

This email was sent automatically by the Blood Sugar Monitor system.
Please do not reply to this email.
`;
  }

  async sendEmail(options: {
    to: string[];
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Blood Sugar Monitor" <${process.env.SMTP_USER}>`,
        to: options.to.join(", "),
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(
        `Email sent to ${options.to.length} recipients: ${options.subject}`
      );
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Email service connection verified");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
