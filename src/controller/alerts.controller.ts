import prisma from "@/config/db.ts";
import { logActivity } from "@/middleware/auth.ts";
import type {
  AlertConfigInput,
  AlertHistoryQueryInput,
} from "@/validation/alertsValidation.ts";
import type { RequestHandler } from "express";

export const createOrUpdateAlertConfig: RequestHandler<
  {},
  {},
  AlertConfigInput,
  {}
> = async (req, res, next) => {
  try {
    const { high_threshold, low_threshold, notification_emails } = req.body;

    if (high_threshold <= low_threshold) {
      return res
        .status(400)
        .json({ error: "High threshold must be greater than low threshold" });
    }

    // Remove duplicates and ensure user's email is included
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true },
    });

    const uniqueEmails = Array.from(
      new Set([
        user?.email,
        ...notification_emails.filter((email) => email && email.trim() !== ""),
      ])
    ).filter(Boolean) as string[];

    const existing = await prisma.alertConfig.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    });

    if (existing) {
      await prisma.alertConfig.update({
        where: { user_id: req.user.id },
        data: {
          high_threshold,
          low_threshold,
          notification_emails: uniqueEmails,
          updated_at: new Date(),
        },
      });

      logActivity(req.user!.id, "UPDATE", "alert_config", existing.id);
    } else {
      const created = await prisma.alertConfig.create({
        data: {
          user_id: req.user.id,
          high_threshold,
          low_threshold,
          notification_emails: uniqueEmails,
        },
      });

      logActivity(req.user!.id, "CREATE", "alert_config", created.id);
    }

    return res.json({ message: "Alert configuration saved successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getAlertConfig: RequestHandler = async (req, res, next) => {
  try {
    const config = await prisma.alertConfig.findUnique({
      where: { user_id: req.user.id },
      select: {
        high_threshold: true,
        low_threshold: true,
        notification_emails: true,
        enabled: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!config)
      return res.status(404).json({ error: "No alert configuration found" });
    return res.json({
      ...config,
      notification_emails: config.notification_emails,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAlertHistory: RequestHandler<
  {},
  {},
  {},
  AlertHistoryQueryInput
> = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, alert_type, acknowledged } = req.query;

    const where: any = { user_id: req.user.id };
    if (alert_type) where.alert_type = alert_type;
    if (acknowledged !== undefined)
      where.acknowledged = String(acknowledged) === "true";

    const alerts = await prisma.alertHistory.findMany({
      where,
      include: {
        reading: {
          select: { glucose_level: true, timestamp: true, context: true },
        },
      },
      orderBy: { created_at: "desc" },
      skip: Number(offset),
      take: Number(limit),
    });

    const total = await prisma.alertHistory.count({ where });
    const mappedAlerts = alerts.map((alert) => ({
      id: alert.id,
      alert_type: alert.alert_type,
      message: alert.message,
      acknowledged: alert.acknowledged,
      acknowledged_at: alert.acknowledged_at,
      created_at: alert.created_at,
      glucose_level: alert.reading?.glucose_level,
      reading_timestamp: alert.reading?.timestamp,
      context: alert.reading?.context,
    }));

    return res.json({
      alerts: mappedAlerts,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + Number(limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const acknowledgeAlert: RequestHandler<
  { alertId: string },
  {},
  {},
  {}
> = async (req, res, next) => {
  try {
    const { alertId } = req.params;

    const result = await prisma.alertHistory.updateMany({
      where: { id: alertId, user_id: req.user.id, acknowledged: false },
      data: { acknowledged: true, acknowledged_at: new Date() },
    });

    if (result.count === 0)
      return res
        .status(404)
        .json({ error: "Alert not found or already acknowledged" });

    logActivity(req.user!.id, "ACKNOWLEDGE", "alert", alertId);

    return res.json({ message: "Alert acknowledged successfully" });
  } catch (error) {
    return next(error);
  }
};

export const toggleAlertConfig: RequestHandler = async (req, res, next) => {
  try {
    const config = await prisma.alertConfig.findUnique({
      where: { user_id: req.user.id },
    });

    if (!config)
      return res.status(404).json({ error: "No alert configuration found" });

    await prisma.alertConfig.update({
      where: { user_id: req.user.id },
      data: { enabled: !config.enabled, updated_at: new Date() },
    });

    logActivity(req.user.id, "TOGGLE", "alert_config");

    return res.json({ message: "Alert configuration toggled successfully" });
  } catch (error) {
    return next(error);
  }
};

export const testEmailNotification: RequestHandler = async (
  req,
  res,
  _next
) => {
  try {
    const config = await prisma.alertConfig.findUnique({
      where: { user_id: req.user.id },
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!config) {
      return res.status(404).json({ error: "No alert configuration found" });
    }

    if (
      !config.notification_emails ||
      config.notification_emails.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "No notification emails configured" });
    }

    const { emailService } = await import("../services/emailService.ts");

    // Test email connection first
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      return res.status(500).json({
        error:
          "Email service connection failed. Please check SMTP configuration.",
      });
    }

    // Send test alert email
    await emailService.sendAlertEmail(config.notification_emails, {
      userEmail: config.user.email,
      userName: `${config.user.first_name} ${config.user.last_name}`,
      glucoseLevel: 200, // Test high glucose value
      alertType: "HIGH_GLUCOSE",
      timestamp: new Date(),
      context: "OTHER",
      thresholds: {
        high: config.high_threshold,
        low: config.low_threshold,
      },
    });

    logActivity(req.user.id, "TEST_EMAIL", "alert_config", config.id);

    return res.json({
      message: "Test email sent successfully",
      recipients: config.notification_emails.length,
    });
  } catch (error) {
    console.error("Test email failed:", error);
    return res.status(500).json({
      error: "Failed to send test email",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const triggerWeeklyReport: RequestHandler = async (req, res, _next) => {
  try {
    // Only allow admins to trigger reports manually
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const { cronService } = await import("../services/cronService.ts");

    await cronService.triggerWeeklyReports();

    logActivity(req.user.id, "TRIGGER_WEEKLY_REPORT", "system");

    return res.json({
      message: "Weekly reports triggered successfully",
    });
  } catch (error) {
    console.error("Failed to trigger weekly reports:", error);
    return res.status(500).json({
      error: "Failed to trigger weekly reports",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
