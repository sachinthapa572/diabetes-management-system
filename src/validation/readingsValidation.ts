import type { ReadingContext } from "@prisma/client";
import { body, query } from "express-validator";
export const CreateReadingSchema = [
  body("glucose_level")
    .isFloat({ min: 20, max: 800 })
    .withMessage("Glucose level must be a number between 20 and 800 mg/dL"),
  body("timestamp")
    .isISO8601()
    .withMessage("Timestamp must be a valid ISO 8601 date"),
  body("context")
    .isIn(["FASTING", "PRE_MEAL", "POST_MEAL", "EXERCISE", "OTHER"])
    .withMessage(
      "Context must be one of: FASTING, PRE_MEAL, POST_MEAL, EXERCISE, OTHER"
    ),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
  body("medication_taken")
    .optional()
    .isBoolean()
    .withMessage("Medication taken must be a boolean value"),
  body("carbs_consumed")
    .optional()
    .isInt({ min: 0, max: 500 })
    .withMessage("Carbs consumed must be an integer between 0 and 500 grams"),
  body("exercise_duration")
    .optional()
    .isInt({ min: 0, max: 480 })
    .withMessage(
      "Exercise duration must be an integer between 0 and 480 minutes"
    ),
  body("stress_level")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Stress level must be an integer between 1 and 10"),
];

export const GetReadingsQuerySchema = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("context")
    .optional()
    .isIn(["FASTING", "PRE_MEAL", "POST_MEAL", "EXERCISE", "OTHER"])
    .withMessage(
      "Context must be one of: FASTING, PRE_MEAL, POST_MEAL, EXERCISE, OTHER"
    ),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a non-negative integer"),
  query("sortBy")
    .optional()
    .isIn(["timestamp", "glucose_level"])
    .withMessage("Sort by must be either 'timestamp' or 'glucose_level'"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be either 'asc' or 'desc'"),
];

export const GetStatsQuerySchema = [
  query("period")
    .optional()
    .isIn(["week", "month", "quarter", "year"])
    .withMessage("Period must be one of: week, month, quarter, year"),
];

export const GetTrendsQuerySchema = [
  query("days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Days must be an integer between 1 and 365"),
  query("groupBy")
    .optional()
    .isIn(["hour", "day", "week"])
    .withMessage("Group by must be one of: hour, day, week"),
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
  context?: "FASTING" | "PRE_MEAL" | "POST_MEAL" | "EXERCISE" | "OTHER";
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
