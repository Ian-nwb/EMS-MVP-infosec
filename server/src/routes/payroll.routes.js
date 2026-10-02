import express from "express";
import {
  getPayrollRecords,
  getPayrollById,
  createPayroll,
  deletePayroll,
  payrollCreateSchema,
} from "../controllers/payroll.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(authenticate);

// View list of payrolls (scoped per role: employee sees only own)
router.get("/", getPayrollRecords);

// View specific payroll (with ownership validation for employee)
router.get("/:id", getPayrollById);

// Create payroll record (HR only)
router.post("/", authorizeRoles("hr"), validate({ body: payrollCreateSchema }), createPayroll);

// Delete payroll record (HR only)
router.delete("/:id", authorizeRoles("hr"), deletePayroll);

export default router;
