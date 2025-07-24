import { Router } from "express";
import {
  createReading,
  deleteReading,
  getReadings,
  getReadingStats,
  getReadingTrends,
} from "../controller/readings.controller";
import { isAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest ";
import {
  CreateReadingSchema,
  GetReadingsQuerySchema,
  GetStatsQuerySchema,
  GetTrendsQuerySchema,
} from "../validation/readingsValidation";

const readingsRouter = Router();

readingsRouter.use(isAuth);

readingsRouter.post("/", CreateReadingSchema, validateRequest, createReading);
readingsRouter.get("/", GetReadingsQuerySchema, validateRequest, getReadings);
readingsRouter.get("/stats", GetStatsQuerySchema, validateRequest, getReadingStats);
readingsRouter.get("/trends", GetTrendsQuerySchema, validateRequest, getReadingTrends);
readingsRouter.delete("/:readingId", deleteReading);

export default readingsRouter;
