import { Router } from "express";
import alertRouter from "./alerts.ts";
import userAuthRouter from "./auth.ts";
import readingsRouter from "./readings.ts";
import userRouter from "./users.ts";

const router = Router();

router.use("/auth", userAuthRouter);
router.use("/readings", readingsRouter);
router.use("/alerts", alertRouter);
router.use("/users", userRouter);

export default router;
