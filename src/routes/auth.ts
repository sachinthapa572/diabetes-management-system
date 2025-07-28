import { validateRequest } from "@/middleware/validateRequest .ts";
import { Router } from "express";
import {
  getUserProfile,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../controller/auth.controller.ts";
import { isAuth } from "../middleware/auth.ts";
import {
  AuthLoginSchema,
  AuthRegisterSchema,
  AuthUpdateProfileSchema,
} from "../validation/authValidation.ts";

const userAuthRouter = Router();

// Register endpoint
userAuthRouter.post(
  "/register",
  AuthRegisterSchema,
  validateRequest,
  registerUser
);

// Login endpoint
userAuthRouter.post("/login", AuthLoginSchema, validateRequest, loginUser);

// Get current user profile
userAuthRouter.get("/profile", isAuth, getUserProfile);

// Update user profile
userAuthRouter.put(
  "/profile",
  isAuth,
  AuthUpdateProfileSchema,
  updateUserProfile
);

export default userAuthRouter;
