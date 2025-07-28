import { Router } from "express";
import {
  createReading,
  deleteReading,
  getReadings,
  getReadingStats,
  getReadingTrends,
} from "../controller/readings.controller.ts";
import { isAuth } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest .ts";
import {
  CreateReadingSchema,
  GetReadingsQuerySchema,
  GetStatsQuerySchema,
  GetTrendsQuerySchema,
} from "../validation/readingsValidation.ts";

const readingsRouter = Router();

readingsRouter.use(isAuth);

readingsRouter.post("/", CreateReadingSchema, validateRequest, createReading);
readingsRouter.get("/", GetReadingsQuerySchema, validateRequest, getReadings);
readingsRouter.get(
  "/stats",
  GetStatsQuerySchema,
  validateRequest,
  getReadingStats
);
readingsRouter.get(
  "/trends",
  GetTrendsQuerySchema,
  validateRequest,
  getReadingTrends
);
readingsRouter.delete("/:readingId", deleteReading);

export default readingsRouter;
