import { z } from "zod";
import { Attendance } from "../models/Attendance.js";
import { Employee } from "../models/Employee.js";
import { logAuditEvent } from "../utils/logger.js";

export const attendanceCheckInSchema = z.object({
  notes: z.string().max(200).optional().default(""),
});

// GET /api/attendance
export async function getAttendance(req, res, next) {
  try {
    let filter = {};

    if (req.user.role === "employee") {
      if (!req.user.employeeId) {
        return res.json({ success: true, count: 0, data: [] });
      }
      filter.employee_id = req.user.employeeId;
    } else if (req.user.role === "manager") {
      if (req.user.employee?.department_id) {
        const teamEmployees = await Employee.find({ department_id: req.user.employee.department_id }).select("_id");
        filter.employee_id = { $in: teamEmployees.map((e) => e._id) };
      }
    }

    const records = await Attendance.find(filter)
      .populate({
        path: "employee_id",
        select: "full_name position department_id",
        populate: { path: "department_id", select: "name" },
      })
      .sort({ date: -1 })
      .limit(100);

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
}

// POST /api/attendance/check-in
export async function checkIn(req, res, next) {
  try {
    let employeeId = req.user.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({ user_id: req.user.id });
      if (!emp) {
        return res.status(400).json({ success: false, message: "No employee profile linked to clock in" });
      }
      employeeId = emp._id;
    }

    // Check if already checked in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      employee_id: employeeId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already clocked in today",
        data: existing,
      });
    }

    const now = new Date();
    // Mark late if after 9:30 AM
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

    const record = await Attendance.create({
      employee_id: employeeId,
      date: now,
      check_in: now,
      status: isLate ? "late" : "present",
      notes: req.body.notes || "",
    });

    await logAuditEvent({
      action: "ATTENDANCE_CHECK_IN",
      resource: "ATTENDANCE",
      resourceId: record._id,
      req,
      details: { status: record.status },
    });

    res.status(201).json({ success: true, message: "Check-in recorded successfully", data: record });
  } catch (err) {
    next(err);
  }
}

// POST /api/attendance/check-out
export async function checkOut(req, res, next) {
  try {
    let employeeId = req.user.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({ user_id: req.user.id });
      if (!emp) {
        return res.status(400).json({ success: false, message: "No employee profile linked to clock out" });
      }
      employeeId = emp._id;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employee_id: employeeId,
      date: { $gte: startOfDay },
      check_out: null,
    }).sort({ check_in: -1 });

    if (!existing) {
      return res.status(400).json({
        success: false,
        message: "No active check-in found for today or you have already checked out",
      });
    }

    existing.check_out = new Date();
    await existing.save();

    await logAuditEvent({
      action: "ATTENDANCE_CHECK_OUT",
      resource: "ATTENDANCE",
      resourceId: existing._id,
      req,
    });

    res.json({ success: true, message: "Check-out recorded successfully", data: existing });
  } catch (err) {
    next(err);
  }
}
