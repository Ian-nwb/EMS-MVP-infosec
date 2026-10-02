import express from "express";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  employeeCreateSchema,
  employeeUpdateSchema,
} from "../controllers/employee.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(authenticate);

// View list of employees (Role-filtered inside controller)
router.get("/", getEmployees);

// View specific employee (Self, Manager, or HR)
router.get("/:id", getEmployeeById);

// Create employee (HR only)
router.post("/", authorizeRoles("hr"), validate({ body: employeeCreateSchema }), createEmployee);

// Update employee (HR or Manager)
router.put("/:id", authorizeRoles("hr", "manager"), validate({ body: employeeUpdateSchema }), updateEmployee);

// Delete employee (HR only)
router.delete("/:id", authorizeRoles("hr"), deleteEmployee);

export default router;
