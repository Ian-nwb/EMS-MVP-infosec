import express from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticate);

// Only HR can inspect audit logs (least privilege)
router.get("/", authorizeRoles("hr"), getAuditLogs);

export default router;
