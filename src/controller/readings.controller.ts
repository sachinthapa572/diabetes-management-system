import prisma from "@/config/db.ts";
import { logActivity } from "@/middleware/auth.ts";
import type {
  CreateReadingInput,
  GetReadingsQuery,
  GetStatsQuery,
  GetTrendsQuery,
} from "@/validation/readingsValidation.ts";
import { Prisma } from "@prisma/client";
import type { RequestHandler } from "express";

export const createReading: RequestHandler<{}, {}, CreateReadingInput> = async (
  req,
  res,
  next
) => {
  try {
    const {
      glucose_level,
      timestamp,
      context,
      notes,
      medication_taken = false,
      carbs_consumed = 0,
      exercise_duration = 0,
      stress_level,
    } = req.body;

    const newReading = await prisma.reading.create({
      data: {
        user_id: req.user!.id,
        glucose_level,
        timestamp: new Date(timestamp),
        context,
        notes: notes || null,
        medication_taken,
        carbs_consumed,
        exercise_duration,
        stress_level,
      },
    });

    await checkGlucoseAlerts(req.user!.id, glucose_level, newReading.id);

    logActivity(req.user!.id, "CREATE", "reading", newReading.id);
    return res
      .status(201)
      .json({ id: newReading.id, message: "Reading recorded successfully" });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getReadings: RequestHandler<{}, {}, {}, GetReadingsQuery> = async (
  req,
  res,
  next
) => {
  try {
    const {
      startDate,
      endDate,
      context,
      limit = 50,
      offset = 0,
      sortBy = "timestamp",
      sortOrder = "desc",
    } = req.query;

    const where: Prisma.ReadingWhereInput = { user_id: req.user!.id };

    if (startDate) where.timestamp = { gte: new Date(startDate) };
    if (endDate) {
      const existingTimestamp =
        typeof where.timestamp === "object" && where.timestamp !== null
          ? where.timestamp
          : {};
      where.timestamp = {
        ...existingTimestamp,
        lte: new Date(endDate),
      };
    }
    if (context) where.context = context.toUpperCase() as any;

    const readings = await prisma.reading.findMany({
      where,
      orderBy: { [sortBy]: sortOrder === "asc" ? "asc" : "desc" },
      skip: Number(offset),
      take: Number(limit),
    });

    const total = await prisma.reading.count({ where });

    logActivity(req.user!.id, "READ", "reading");

    return res.json({
      readings,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + Number(limit),
      },
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getReadingStats: RequestHandler<
  {},
  {},
  {},
  GetStatsQuery
> = async (req, res, next) => {
  try {
    const { period = "month" } = req.query;
    let dateFrom: Date | undefined;
    const now = new Date();

    switch (period) {
      case "week":
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const where: Prisma.ReadingWhereInput = { user_id: req.user!.id };
    if (dateFrom) where.timestamp = { gte: dateFrom };

    const readings = await prisma.reading.findMany({ where });
    const total_readings = readings.length;
    const glucoseLevels = readings.map((r) => r.glucose_level);
    const average_glucose = glucoseLevels.length
      ? glucoseLevels.reduce((a, b) => a + b, 0) / glucoseLevels.length
      : null;
    const min_glucose = glucoseLevels.length
      ? Math.min(...glucoseLevels)
      : null;
    const max_glucose = glucoseLevels.length
      ? Math.max(...glucoseLevels)
      : null;
    const low_readings = readings.filter((r) => r.glucose_level < 70).length;
    const high_readings = readings.filter((r) => r.glucose_level > 180).length;
    const normal_readings = readings.filter(
      (r) => r.glucose_level >= 70 && r.glucose_level <= 180
    ).length;
    const time_in_range =
      total_readings > 0 ? (normal_readings / total_readings) * 100 : 0;

    logActivity(req.user!.id, "READ", "stats");

    return res.json({
      total_readings,
      average_glucose,
      min_glucose,
      max_glucose,
      low_readings,
      high_readings,
      normal_readings,
      time_in_range: Math.round(time_in_range * 100) / 100,
      period,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getReadingTrends: RequestHandler<
  {},
  {},
  {},
  GetTrendsQuery
> = async (req, res, next) => {
  try {
    const { days = 30, groupBy = "day" } = req.query;
    const now = new Date();
    const fromDate = new Date(
      now.getTime() - Number(days) * 24 * 60 * 60 * 1000
    );

    const readings = await prisma.reading.findMany({
      where: {
        user_id: req.user!.id,
        timestamp: { gte: fromDate },
      },
      orderBy: { timestamp: "asc" },
    });

    const trends: Record<string, number[]> = {};
    readings.forEach((r) => {
      let period: string = "";
      const date = new Date(r.timestamp);
      switch (groupBy) {
        case "hour": {
          period = date.toISOString().slice(0, 13) + ":00:00";
          break;
        }
        case "day": {
          period = date.toISOString().slice(0, 10);
          break;
        }
        case "week": {
          const year = date.getUTCFullYear();
          const week = getISOWeek(date);
          period = `${year}-W${week}`;
          break;
        }
        default: {
          period = date.toISOString().slice(0, 10);
        }
      }
      if (!trends[period]) trends[period] = [];
      (trends[period] ?? []).push(r.glucose_level);
    });

    const trendData = Object.entries(trends).map(
      ([period, values]: [string, number[]]) => {
        const avg_glucose = values.reduce((a, b) => a + b, 0) / values.length;
        return {
          period,
          avg_glucose,
          min_glucose: Math.min(...values),
          max_glucose: Math.max(...values),
          reading_count: values.length,
        };
      }
    );

    logActivity(req.user!.id, "READ", "trends");

    return res.status(200).json({
      trends: trendData,
      groupBy,
      days: Number(days),
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const deleteReading: RequestHandler<{ readingId: string }> = async (
  req,
  res,
  next
) => {
  try {
    const { readingId } = req.params;
    const userId = req.user!.id;

    // Check if the reading exists and belongs to the user
    const reading = await prisma.reading.findFirst({
      where: {
        id: readingId,
        user_id: userId,
      },
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: "Reading not found or you don't have permission to delete it",
      });
    }

    // Delete related alert history first (if any)
    await prisma.alertHistory.deleteMany({
      where: { reading_id: readingId },
    });

    // Delete the reading
    await prisma.reading.delete({
      where: { id: readingId },
    });

    // Log the deletion activity
    logActivity(userId, "DELETE", "reading", readingId);

    return res.json({
      success: true,
      message: "Reading deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

function getISOWeek(date: Date) {
  const tmp = new Date(date.getTime());
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNo;
}

async function checkGlucoseAlerts(
  userId: string,
  glucoseLevel: number,
  readingId: string
) {
  const alertConfig = await prisma.alertConfig.findFirst({
    where: { user_id: userId, enabled: true },
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
  if (!alertConfig) return;

  let alertType: "HIGH_GLUCOSE" | "LOW_GLUCOSE" | null = null;
  let message = "";

  if (glucoseLevel >= alertConfig.high_threshold) {
    alertType = "HIGH_GLUCOSE";
    message = `High glucose reading: ${glucoseLevel} mg/dL`;
  } else if (glucoseLevel <= alertConfig.low_threshold) {
    alertType = "LOW_GLUCOSE";
    message = `Low glucose reading: ${glucoseLevel} mg/dL`;
  }

  if (alertType) {
    // Get the reading details for email context
    const reading = await prisma.reading.findUnique({
      where: { id: readingId },
      select: { context: true, timestamp: true },
    });

    // Create alert history record
    await prisma.alertHistory.create({
      data: {
        user_id: userId,
        reading_id: readingId,
        alert_type: alertType,
        message,
      },
    });

    // Send email notification if notification emails are configured
    if (
      alertConfig.notification_emails &&
      alertConfig.notification_emails.length > 0
    ) {
      try {
        const { emailService } = await import("../services/emailService.ts");

        await emailService.sendAlertEmail(alertConfig.notification_emails, {
          userEmail: alertConfig.user.email,
          userName: `${alertConfig.user.first_name} ${alertConfig.user.last_name}`,
          glucoseLevel,
          alertType,
          timestamp: reading?.timestamp || new Date(),
          context: reading?.context || "OTHER",
          thresholds: {
            high: alertConfig.high_threshold,
            low: alertConfig.low_threshold,
          },
        });

        logActivity(userId, "EMAIL_SENT", "alert", readingId, {
          type: alertType,
          glucose_level: glucoseLevel,
          recipients: alertConfig.notification_emails.length,
        });
      } catch (emailError) {
        console.error("Failed to send alert email:", emailError);
        // Log the email failure but don't throw - alert should still be recorded
        logActivity(userId, "EMAIL_FAILED", "alert", readingId, {
          type: alertType,
          glucose_level: glucoseLevel,
          error:
            emailError instanceof Error ? emailError.message : "Unknown error",
        });
      }
    }

    logActivity(userId, "ALERT", "glucose", readingId, {
      type: alertType,
      glucose_level: glucoseLevel,
    });
  }
}
