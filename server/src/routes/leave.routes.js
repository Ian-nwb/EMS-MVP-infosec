import express from "express";
import {
  getLeaveRequests,
  createLeaveRequest,
  reviewLeaveRequest,
  leaveCreateSchema,
  leaveReviewSchema,
} from "../controllers/leave.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(authenticate);

// All authenticated users can query (scoped by role inside controller)
router.get("/", getLeaveRequests);

// Employees (and others) can create leave requests
router.post("/", validate({ body: leaveCreateSchema }), createLeaveRequest);

// Managers and HR can review (approve/reject)
router.put(
  "/:id/review",
  authorizeRoles("hr", "manager"),
  validate({ body: leaveReviewSchema }),
  reviewLeaveRequest
);

export default router;
