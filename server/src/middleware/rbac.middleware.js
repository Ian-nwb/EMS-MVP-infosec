import { logAuditEvent } from "../utils/logger.js";

/**
 * RBAC Guard Middleware
 * Usage: authorizeRoles("hr", "manager")
 */
export function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before access check",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt for audit/compliance
      await logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        action: "RBAC_ACCESS_DENIED",
        resource: req.baseUrl + req.path,
        status: "DENIED",
        req,
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          method: req.method,
          path: req.originalUrl,
        },
      });

      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(", ")}] roles. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
}
