import { z } from "zod";
import mongoose from "mongoose";
import { LeaveRequest } from "../models/LeaveRequest.js";
import { Employee } from "../models/Employee.js";
import { logAuditEvent } from "../utils/logger.js";

export const leaveCreateSchema = z.object({
  leave_type: z.enum(["vacation", "sick", "personal", "maternity", "emergency"]),
  start_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  end_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
});

export const leaveReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewer_notes: z.string().max(500).optional().default(""),
});

// GET /api/leave
export async function getLeaveRequests(req, res, next) {
  try {
    let filter = {};

    if (req.user.role === "employee") {
      // Find employee linked to this user
      if (!req.user.employeeId) {
        return res.json({ success: true, count: 0, data: [] });
      }
      filter.employee_id = req.user.employeeId;
    } else if (req.user.role === "manager") {
      // Managers can review employees in their department
      if (req.user.employee?.department_id) {
        const teamEmployees = await Employee.find({ department_id: req.user.employee.department_id }).select("_id");
        const empIds = teamEmployees.map((e) => e._id);
        filter.employee_id = { $in: empIds };
      }
    }

    const leaves = await LeaveRequest.find(filter)
      .populate({
        path: "employee_id",
        select: "full_name position department_id",
        populate: { path: "department_id", select: "name" },
      })
      .populate("reviewed_by", "email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (err) {
    next(err);
  }
}

// POST /api/leave (Submit leave request)
export async function createLeaveRequest(req, res, next) {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;

    // Must be linked to an employee record
    let employeeId = req.user.employeeId;
    if (!employeeId) {
      // Look up if user has an employee record
      const emp = await Employee.findOne({ user_id: req.user.id });
      if (!emp) {
        return res.status(400).json({
          success: false,
          message: "You must have an employee profile linked to submit a leave request",
        });
      }
      employeeId = emp._id;
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    const leave = await LeaveRequest.create({
      employee_id: employeeId,
      leave_type,
      start_date,
      end_date,
      reason,
      status: "pending",
    });

    await logAuditEvent({
      action: "LEAVE_REQUEST_SUBMITTED",
      resource: "LEAVE_REQUEST",
      resourceId: leave._id,
      req,
      details: { leave_type, start_date, end_date },
    });

    const populated = await LeaveRequest.findById(leave._id).populate("employee_id", "full_name position");

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: populated,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/leave/:id/review (Approve or Reject - Manager or HR)
export async function reviewLeaveRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { status, reviewer_notes } = req.body;

    const leave = await LeaveRequest.findById(id).populate("employee_id");
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    // Manager ownership check: can only review employees within their department (HR can review all)
    if (req.user.role === "manager" && req.user.employee?.department_id) {
      if (String(leave.employee_id.department_id) !== String(req.user.employee.department_id)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You may only review leave requests for your department.",
        });
      }
    }

    leave.status = status;
    leave.reviewer_notes = reviewer_notes || "";
    leave.reviewed_by = req.user.id;
    await leave.save();

    await logAuditEvent({
      action: `LEAVE_REQUEST_${status.toUpperCase()}`,
      resource: "LEAVE_REQUEST",
      resourceId: leave._id,
      req,
      details: {
        status,
        employeeName: leave.employee_id?.full_name,
        reviewerNotes: reviewer_notes,
      },
    });

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: leave,
    });
  } catch (err) {
    next(err);
  }
}
