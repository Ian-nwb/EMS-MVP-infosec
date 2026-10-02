import express from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  departmentSchema,
} from "../controllers/department.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(authenticate);

// All authenticated roles can view departments
router.get("/", getDepartments);

// Only HR can create, update, or delete departments
router.post("/", authorizeRoles("hr"), validate({ body: departmentSchema }), createDepartment);
router.put("/:id", authorizeRoles("hr"), validate({ body: departmentSchema }), updateDepartment);
router.delete("/:id", authorizeRoles("hr"), deleteDepartment);

export default router;
