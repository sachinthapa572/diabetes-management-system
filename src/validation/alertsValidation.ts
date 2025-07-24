import { body, query } from "express-validator";

export interface AlertConfigInput {
    high_threshold: number;
    low_threshold: number;
    notification_methods: ("email" | "sms" | "push")[];
}

export const AlertConfigSchema = [
    body("high_threshold").isFloat({ min: 100, max: 500 }),
    body("low_threshold").isFloat({ min: 30, max: 100 }),
    body("notification_methods")
        .isArray()
        .custom((value) => {
            const validMethods = ["email", "sms", "push"];
            return value.every((method: string) => validMethods.includes(method));
        }),
];

export const AlertHistoryQuerySchema = [
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 }),
    query("alert_type").optional().isIn(["high", "low", "critical"]),
    query("acknowledged").optional().isBoolean(),
];

export interface AlertHistoryQueryInput {
    limit?: number;
    offset?: number;
    alert_type?: "high" | "low" | "critical";
    acknowledged?: boolean;
}
