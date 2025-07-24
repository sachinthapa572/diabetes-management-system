import { body, query } from "express-validator";

export interface AlertConfigInput {
    high_threshold: number;
    low_threshold: number;
    notification_methods: ("email" | "sms" | "push")[];
}

export const AlertConfigSchema = [
    body("high_threshold")
        .isFloat({ min: 100, max: 500 })
        .withMessage("High threshold must be a number between 100 and 500 mg/dL"),
    body("low_threshold")
        .isFloat({ min: 30, max: 100 })
        .withMessage("Low threshold must be a number between 30 and 100 mg/dL"),
    body("notification_methods")
        .isArray()
        .withMessage("Notification methods must be an array")
        .custom((value) => {
            const validMethods = ["email", "sms", "push"];
            return value.every((method: string) => validMethods.includes(method));
        })
        .withMessage("Notification methods must contain only: email, sms, push"),
];

export const AlertHistoryQuerySchema = [
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be an integer between 1 and 100"),
    query("offset")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Offset must be a non-negative integer"),
    query("alert_type")
        .optional()
        .isIn(["HIGH_GLUCOSE", "LOW_GLUCOSE"])
        .withMessage("Alert type must be one of: HIGH_GLUCOSE, LOW_GLUCOSE"),
    query("acknowledged")
        .optional()
        .isBoolean()
        .withMessage("Acknowledged must be a boolean value"),
];

export interface AlertHistoryQueryInput {
    limit?: number;
    offset?: number;
    alert_type?: "HIGH_GLUCOSE" | "LOW_GLUCOSE";
    acknowledged?: boolean;
}
