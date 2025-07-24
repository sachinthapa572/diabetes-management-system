import type { ReadingContext } from "@prisma/client";
import { body, query } from "express-validator";
export const CreateReadingSchema = [
  body("glucose_level").isFloat({ min: 20, max: 800 }),
  body("timestamp").isISO8601(),
  body("context").isIn([
    "fasting",
    "pre_meal",
    "post_meal",
    "bedtime",
    "other",
  ]),
  body("notes").optional().trim().isLength({ max: 500 }),
  body("medication_taken").optional().isBoolean(),
  body("carbs_consumed").optional().isInt({ min: 0, max: 500 }),
  body("exercise_duration").optional().isInt({ min: 0, max: 480 }),
  body("stress_level").optional().isInt({ min: 1, max: 10 }),
];

export const GetReadingsQuerySchema = [
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
  query("context")
    .optional()
    .isIn(["fasting", "pre_meal", "post_meal", "bedtime", "other"]),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("offset").optional().isInt({ min: 0 }),
  query("sortBy").optional().isIn(["timestamp", "glucose_level"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];

export const GetStatsQuerySchema = [
  query("period").optional().isIn(["week", "month", "quarter", "year"]),
];

export const GetTrendsQuerySchema = [
  query("days").optional().isInt({ min: 1, max: 365 }),
  query("groupBy").optional().isIn(["hour", "day", "week"]),
];

export type CreateReadingInput = {
  glucose_level: number;
  timestamp: string;
  context: ReadingContext;
  notes?: string;
  medication_taken?: boolean;
  carbs_consumed?: number;
  exercise_duration?: number;
  stress_level?: number;
};

export type GetReadingsQuery = {
  startDate?: string;
  endDate?: string;
  context?: "fasting" | "pre_meal" | "post_meal" | "bedtime" | "other";
  limit?: number;
  offset?: number;
  sortBy?: "timestamp" | "glucose_level";
  sortOrder?: "asc" | "desc";
};

export type GetStatsQuery = {
  period?: "week" | "month" | "quarter" | "year";
};

export type GetTrendsQuery = {
  days?: number;
  groupBy?: "hour" | "day" | "week";
};
