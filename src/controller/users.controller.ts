import prisma from "@/config/db";
import { logActivity } from "@/middleware/auth";
import type {
  GetPatientReadingsQuery,
  GetPatientsQuery,
} from "@/validation/usersValidation";
import { Role } from "@prisma/client";
import type { RequestHandler } from "express";

export const getPatients: RequestHandler<{}, {}, {}, GetPatientsQuery> = async (
  req,
  res,
  next
) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    const providerId = req.user.id;

    const where: any = {
      provider_id: providerId,
      active: true,
      patient: {
        ...(search
          ? {
              OR: [
                {
                  first_name: {
                    contains: search as string,
                    mode: "insensitive",
                  },
                },
                {
                  last_name: {
                    contains: search as string,
                    mode: "insensitive",
                  },
                },
                { email: { contains: search as string, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    };
    const patients = await prisma.patientProvider.findMany({
      where,
      include: {
        patient: true,
      },
      orderBy: [
        { patient: { last_name: "asc" } },
        { patient: { first_name: "asc" } },
      ],
      skip: Number(offset),
      take: Number(limit),
    });
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const patientIds = patients.map((p) => p.patient_id);
    //   TODO - Optimize this query and look for the type infrence
    const readingsCounts: any = await prisma.reading.groupBy({
      by: ["user_id"],
      where: {
        user_id: { in: patientIds },
        timestamp: { gte: thirtyDaysAgo },
      },
      _count: { user_id: true },
    });
    const readingsCountMap: Record<string, number> = {};
    readingsCounts.forEach((rc: any) => {
      readingsCountMap[rc.user_id] = rc._count.user_id;
    });
    const total = await prisma.patientProvider.count({ where });

    // Log activity
    logActivity(req.user.id, "VIEW", "patients");

    res.json({
      patients: patients.map((pp: any) => ({
        id: pp.patient.id,
        email: pp.patient.email,
        first_name: pp.patient.first_name,
        last_name: pp.patient.last_name,
        date_of_birth: pp.patient.date_of_birth,
        phone: pp.patient.phone,
        medical_record_number: pp.patient.medical_record_number,
        last_login_at: pp.patient.last_login_at,
        relationship_type: pp.relationship_type,
        relationship_since: pp.created_at,
        recent_readings: readingsCountMap[pp.patient.id] || 0,
      })),
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

export const getPatientDetails: RequestHandler<{ patientId: string }> = async (
  req,
  res,
  next
) => {
  try {
    const { patientId } = req.params;
    const providerId = req.user.id;

    const relationship = await prisma.patientProvider.findFirst({
      where: { patient_id: patientId, provider_id: providerId, active: true },
    });

    if (!relationship)
      return res.status(403).json({ error: "Access denied to this patient" });

    const patient = await prisma.user.findFirst({
      where: {
        id: patientId,
        role: Role.PATIENT,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        date_of_birth: true,
        phone: true,
        medical_record_number: true,
        emergency_contact_name: true,
        emergency_contact_phone: true,
        last_login_at: true,
        created_at: true,
      },
    });

    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const statsAgg = await prisma.reading.aggregate({
      where: { user_id: patientId, timestamp: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      _avg: { glucose_level: true },
      _min: { glucose_level: true },
      _max: { glucose_level: true },
    });

    //   create a comprehensive stats object so that it can be used in the frontend as the chart data
    const stats = {
      total_readings: statsAgg._count._all,
      avg_glucose: statsAgg._avg.glucose_level,
      min_glucose: statsAgg._min.glucose_level,
      max_glucose: statsAgg._max.glucose_level,
      low_readings: await prisma.reading.count({
        where: {
          user_id: patientId,
          timestamp: { gte: thirtyDaysAgo },
          glucose_level: { lt: 70 },
        },
      }),
      high_readings: await prisma.reading.count({
        where: {
          user_id: patientId,
          timestamp: { gte: thirtyDaysAgo },
          glucose_level: { gt: 180 },
        },
      }),
    };

    // get the recent alerts for the patient
    const recentAlerts = await prisma.alertHistory.findMany({
      where: { user_id: patientId },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        alert_type: true,
        message: true,
        acknowledged: true,
        created_at: true,
      },
    });

    // Log activity
    logActivity(req.user.id, "VIEW", "patient_details", patientId);

    return res.json({ patient, stats, recentAlerts });
  } catch (error) {
    return next(error);
  }
};

export const getPatientReadings: RequestHandler<
  { patientId: string },
  {},
  {},
  GetPatientReadingsQuery
> = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;
    const providerId = req.user.id;

    //   check the relationship between the provider and the patient
    const relationship = await prisma.patientProvider.findFirst({
      where: { patient_id: patientId, provider_id: providerId, active: true },
    });

    if (!relationship)
      return res.status(403).json({ error: "Access denied to this patient" });

    const where: any = { user_id: patientId };
    if (startDate) where.timestamp = { gte: new Date(startDate as string) };
    if (endDate) {
      where.timestamp = where.timestamp
        ? { ...where.timestamp, lte: new Date(endDate as string) }
        : { lte: new Date(endDate as string) };
    }

    //   fetch the readings for the patient
    const readings = await prisma.reading.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Number(limit),
    });

    // Log activity
    logActivity(req.user.id, "VIEW", "patient_readings", patientId);

    return res.json({ readings });
  } catch (error) {
    return next(error);
  }
};
