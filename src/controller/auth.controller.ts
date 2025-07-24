import { generateToken, logActivity } from "@/middleware/auth";
import type {
  AuthLoginInput,
  AuthRegisterInput,
  AuthUpdateProfileInput,
} from "@/validation/authValidation";
import { Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { validationResult } from "express-validator";
import prisma from "../../prisma/db";

export const registerUser: RequestHandler<
  {},
  {},
  AuthRegisterInput,
  {}
> = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role = Role.PATIENT,
      dateOfBirth,
      phone,
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Validation failed",
        errors: [
          { field: "email", message: "Email already exists , try to login" },
        ],
      });
    }

    // Hash password
    const passwordHash = Bun.password.hashSync(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        role: role,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: new Date(dateOfBirth),
        phone: phone || null,
      },
    });

    // Log activity
    logActivity(user.id, "CREATE", "user", user.id);

    // Generate token
    const token = generateToken(user.id);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        email,
        role,
        firstName,
        lastName,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const loginUser: RequestHandler<{}, {}, AuthLoginInput, {}> = async (
  req,
  res,
  next
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        role: true,
        first_name: true,
        last_name: true,
        two_factor_enabled: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = Bun.password.verifySync(
      password,
      user.password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Log activity
    logActivity(user.id, "LOGIN", "auth");

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        twoFactorEnabled: user.two_factor_enabled,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        date_of_birth: true,
        phone: true,
        medical_record_number: true,
        emergency_contact_name: true,
        emergency_contact_phone: true,
        two_factor_enabled: true,
        last_login_at: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
};

export const updateUserProfile: RequestHandler<
  {},
  {},
  AuthUpdateProfileInput,
  {}
> = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      phone,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone || undefined,
        emergency_contact_name: emergencyContactName || undefined,
        emergency_contact_phone: emergencyContactPhone || undefined,
        updated_at: new Date(),
      },
    });

    // Log activity
    logActivity(req.user.id, "UPDATE", "profile", req.user.id);

    return res.json({ message: "Profile updated successfully" });
  } catch (error) {
    return next(error);
  }
};
