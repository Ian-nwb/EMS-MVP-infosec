import { AuditLog } from "../models/AuditLog.js";

/**
 * Audit log recording helper.
 * Captures sensitive operations and persists to AuditLog collection.
 */
export async function logAuditEvent({
  userId = null,
  userEmail = null,
  action,
  resource,
  resourceId = null,
  status = "SUCCESS",
  req = null,
  details = {},
}) {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
      userAgent = req.headers["user-agent"];
      if (!userId && req.user) {
        userId = req.user._id || req.user.id;
        userEmail = req.user.email;
      }
    }

    // Strip out sensitive fields (like passwords, full SSNs) from details to prevent log leakage
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.password_hash;
    delete sanitizedDetails.token;

    await AuditLog.create({
      user_id: userId,
      user_email: userEmail,
      action,
      resource,
      resource_id: resourceId ? String(resourceId) : null,
      status,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: sanitizedDetails,
    });
  } catch (err) {
    // Audit logging should not crash the main application, but should alert console
    console.error("[AuditLog Error] Failed to write audit record:", err.message);
  }
}

export const logger = {
  info: (msg, meta = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta),
  warn: (msg, meta = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta),
  error: (msg, meta = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta),
};
