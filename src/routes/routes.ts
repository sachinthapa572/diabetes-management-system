import { Router } from "express";
import alertRouter from "./alerts";
import userAuthRouter from "./auth";
import readingsRouter from "./readings";
import userRouter from "./users";

const router = Router();

router.use("/auth", userAuthRouter);
router.use("/readings", readingsRouter);
router.use("/alerts", alertRouter);
router.use("/users", userRouter);

export default router;
