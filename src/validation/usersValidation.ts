import { query } from "express-validator";

export const GetPatientsQuerySchema = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a non-negative integer"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Search term must not be empty"),
];

export const GetPatientReadingsQuerySchema = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
];

export type GetPatientsQuery = {
  limit?: number;
  offset?: number;
  search?: string;
};

export type GetPatientReadingsQuery = {
  startDate?: string;
  endDate?: string;
  limit?: number;
};
