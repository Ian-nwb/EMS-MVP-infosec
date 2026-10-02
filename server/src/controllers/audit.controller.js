import { AuditLog } from "../models/AuditLog.js";

// GET /api/audit (HR and Manager only)
export async function getAuditLogs(req, res, next) {
  try {
    const { action, resource, status, limit = 100 } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (status) filter.status = status;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 100, 200));

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}
