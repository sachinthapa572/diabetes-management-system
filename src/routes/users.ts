import { Router } from "express";
import {
  getPatientDetails,
  getPatientReadings,
  getPatients,
} from "../controller/users.controller";
import { isAuth, requireRole } from "../middleware/auth";
import {
  GetPatientReadingsQuerySchema,
  GetPatientsQuerySchema,
} from "../validation/usersValidation";

const userRouter = Router();
userRouter.use(isAuth);

// Get patients for a healthcare provider
userRouter.get(
  "/patients",

  requireRole("provider"),
  GetPatientsQuerySchema,
  getPatients
);

// Get patient details for healthcare provider
userRouter.get(
  "/patients/:patientId",
  requireRole("provider"),
  getPatientDetails
);

// Get patient's readings for healthcare provider
userRouter.get(
  "/patients/:patientId/readings",
  requireRole("provider"),
  GetPatientReadingsQuerySchema,
  getPatientReadings
);

export default userRouter;
