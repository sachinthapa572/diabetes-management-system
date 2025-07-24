import { validateRequest } from "@/middleware/validateRequest ";
import { Router } from "express";
import {
  getUserProfile,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../controller/auth.controller";
import { isAuth } from "../middleware/auth";
import {
  AuthLoginSchema,
  AuthRegisterSchema,
  AuthUpdateProfileSchema,
} from "../validation/authValidation";

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
