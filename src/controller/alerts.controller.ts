import { logActivity } from "@/middleware/auth";
import type {
  AlertConfigInput,
  AlertHistoryQueryInput,
} from "@/validation/alertsValidation";
import type { RequestHandler } from "express";
import { validationResult } from "express-validator";
import prisma from "../../prisma/db";

export const createOrUpdateAlertConfig: RequestHandler<
  {},
  {},
  AlertConfigInput,
  {}
> = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { high_threshold, low_threshold, notification_methods } = req.body;

    if (high_threshold <= low_threshold) {
      return res
        .status(400)
        .json({ error: "High threshold must be greater than low threshold" });
    }

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
          notification_methods,
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
          notification_methods,
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
        notification_methods: true,
        enabled: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!config)
      return res.status(404).json({ error: "No alert configuration found" });
    return res.json({
      ...config,
      notification_methods: config.notification_methods,
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
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

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
