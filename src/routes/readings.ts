import { Router } from "express";
import {
  createReading,
  getReadings,
  getReadingStats,
  getReadingTrends,
} from "../controller/readings.controller";
import { isAuth } from "../middleware/auth";
import {
  CreateReadingSchema,
  GetReadingsQuerySchema,
  GetStatsQuerySchema,
  GetTrendsQuerySchema,
} from "../validation/readingsValidation";

const readingsRouter = Router();

readingsRouter.use(isAuth);

readingsRouter.post("/", CreateReadingSchema, createReading);
readingsRouter.get("/", GetReadingsQuerySchema, getReadings);
readingsRouter.get("/stats", GetStatsQuerySchema, getReadingStats);
readingsRouter.get("/trends", GetTrendsQuerySchema, getReadingTrends);

export default readingsRouter;
