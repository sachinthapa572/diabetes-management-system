import { query } from "express-validator";

export const GetPatientsQuerySchema = [
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("offset").optional().isInt({ min: 0 }),
  query("search").optional().trim(),
];

export const GetPatientReadingsQuerySchema = [
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
  query("limit").optional().isInt({ min: 1, max: 100 }),
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
