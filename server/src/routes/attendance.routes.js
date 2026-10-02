import express from "express";
import {
  getAttendance,
  checkIn,
  checkOut,
  attendanceCheckInSchema,
} from "../controllers/attendance.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(authenticate);

// View attendance history (role-filtered)
router.get("/", getAttendance);

// Clock-in
router.post("/check-in", validate({ body: attendanceCheckInSchema }), checkIn);

// Clock-out
router.post("/check-out", checkOut);

export default router;
