import { Role } from "@prisma/client";
import { body } from "express-validator";

export const AuthRegisterSchema = [
  body("email").isEmail().withMessage("Invalid email address").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("firstName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("First name is required"),
  body("lastName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Last name is required"),
  body("role")
    .optional()
    .isIn(["patient", "provider"])
    .withMessage("Role must be either 'patient' or 'provider'"),
  body("dateOfBirth")
    .isISO8601()
    .toDate()
    .withMessage("Date of birth must be a valid ISO date (e.g. 1990-01-01)"),
  body("phone")
    .optional()
    .isMobilePhone("any")
    .withMessage("Phone number must be valid"),
];

export const AuthLoginSchema = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

export const AuthUpdateProfileSchema = [
  body("firstName").optional().trim().isLength({ min: 1 }),
  body("lastName").optional().trim().isLength({ min: 1 }),
  body("phone").optional().isMobilePhone("any"),
  body("emergencyContactName").optional().trim(),
  body("emergencyContactPhone").optional().isMobilePhone("any"),
];

export interface AuthRegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  dateOfBirth: Date;
  phone?: string;
}

export interface AuthLoginInput {
  email: string;
  password: string;
}

export interface AuthUpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dateOfBirth?: Date;
}
