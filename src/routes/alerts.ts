import { Router } from "express";
import {
  acknowledgeAlert,
  createOrUpdateAlertConfig,
  getAlertConfig,
  getAlertHistory,
  toggleAlertConfig,
} from "../controller/alerts.controller";
import { isAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest ";
import {
  AlertConfigSchema,
  AlertHistoryQuerySchema,
} from "../validation/alertsValidation";

const alertRouter = Router();
alertRouter.use(isAuth);

// Create or update alert configuration
alertRouter.post("/", AlertConfigSchema, validateRequest, createOrUpdateAlertConfig);

// Get alert configuration
alertRouter.get("/config", getAlertConfig);

// Get alert history
alertRouter.get("/history", AlertHistoryQuerySchema, validateRequest, getAlertHistory);

// Acknowledge an alert
alertRouter.patch("/:alertId/acknowledge", acknowledgeAlert);

// Toggle alert configuration enabled/disabled
alertRouter.patch("/config/toggle", toggleAlertConfig);

export default alertRouter;
