import { Router } from "express";
import {
  acknowledgeAlert,
  createOrUpdateAlertConfig,
  getAlertConfig,
  getAlertHistory,
  testEmailNotification,
  toggleAlertConfig,
  triggerWeeklyReport,
} from "../controller/alerts.controller.ts";
import { isAuth } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest .ts";
import {
  AlertConfigSchema,
  AlertHistoryQuerySchema,
} from "../validation/alertsValidation.ts";

const alertRouter = Router();
alertRouter.use(isAuth);

// Create or update alert configuration
alertRouter.post(
  "/",
  AlertConfigSchema,
  validateRequest,
  createOrUpdateAlertConfig
);

// Get alert configuration
alertRouter.get("/config", getAlertConfig);

// Get alert history
alertRouter.get(
  "/history",
  AlertHistoryQuerySchema,
  validateRequest,
  getAlertHistory
);

// Acknowledge an alert
alertRouter.patch("/:alertId/acknowledge", acknowledgeAlert);

// Toggle alert configuration enabled/disabled
alertRouter.patch("/config/toggle", toggleAlertConfig);

// Test email notification
alertRouter.post("/test-email", testEmailNotification);

// Trigger weekly report (for testing)
alertRouter.post("/trigger-weekly-report", triggerWeeklyReport);

export default alertRouter;
