import { z } from "zod";
import mongoose from "mongoose";
import { Payroll } from "../models/Payroll.js";
import { Employee } from "../models/Employee.js";
import { logAuditEvent } from "../utils/logger.js";

export const payrollCreateSchema = z.object({
  employee_id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Valid Employee ID required"),
  basic_salary: z.number().nonnegative("Basic salary must be non-negative"),
  allowances: z.number().nonnegative().optional().default(0),
  deductions: z.number().nonnegative().optional().default(0),
  pay_period: z.string().min(3).max(50),
  pay_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  status: z.enum(["draft", "processed", "paid"]).optional().default("processed"),
});

// GET /api/payroll (HR: all; Employee: only own payslips; Manager: read-only for department)
export async function getPayrollRecords(req, res, next) {
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

    const records = await Payroll.find(filter)
      .populate({
        path: "employee_id",
        select: "full_name position department_id",
        populate: { path: "department_id", select: "name" },
      })
      .sort({ pay_date: -1 });

    // Sensitive audit log: track access to payroll list
    await logAuditEvent({
      action: "PAYROLL_VIEW_LIST",
      resource: "PAYROLL",
      req,
      details: { count: records.length, userRole: req.user.role },
    });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
}

// GET /api/payroll/:id (Check ownership for employee)
export async function getPayrollById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid payroll record ID" });
    }

    const record = await Payroll.findById(id).populate({
      path: "employee_id",
      select: "full_name position department_id contact_number",
      populate: { path: "department_id", select: "name" },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }

    // Ownership check: Employee can only view their own
    if (req.user.role === "employee" && String(record.employee_id._id) !== String(req.user.employeeId)) {
      await logAuditEvent({
        action: "PAYROLL_UNAUTHORIZED_ACCESS",
        resource: "PAYROLL",
        resourceId: id,
        status: "DENIED",
        req,
      });
      return res.status(403).json({ success: false, message: "Forbidden: You cannot view another employee's payslip" });
    }

    await logAuditEvent({
      action: "PAYROLL_VIEW_RECORD",
      resource: "PAYROLL",
      resourceId: id,
      req,
      details: { employeeName: record.employee_id.full_name, pay_period: record.pay_period },
    });

    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

// POST /api/payroll (HR only)
export async function createPayroll(req, res, next) {
  try {
    const { employee_id, basic_salary, allowances, deductions, pay_period, pay_date, status } = req.body;

    const employee = await Employee.findById(employee_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const net_pay = Number(basic_salary) + Number(allowances || 0) - Number(deductions || 0);

    const record = await Payroll.create({
      employee_id,
      basic_salary,
      allowances: allowances || 0,
      deductions: deductions || 0,
      net_pay,
      pay_period,
      pay_date: pay_date ? new Date(pay_date) : new Date(),
      status: status || "processed",
    });

    await logAuditEvent({
      action: "PAYROLL_CREATE",
      resource: "PAYROLL",
      resourceId: record._id,
      req,
      details: {
        employeeName: employee.full_name,
        net_pay,
        pay_period,
      },
    });

    const populated = await Payroll.findById(record._id).populate("employee_id", "full_name position");

    res.status(201).json({ success: true, message: "Payroll record created successfully", data: populated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/payroll/:id (HR only)
export async function deletePayroll(req, res, next) {
  try {
    const { id } = req.params;

    const record = await Payroll.findByIdAndDelete(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }

    await logAuditEvent({
      action: "PAYROLL_DELETE",
      resource: "PAYROLL",
      resourceId: id,
      req,
      details: { pay_period: record.pay_period },
    });

    res.json({ success: true, message: "Payroll record deleted successfully" });
  } catch (err) {
    next(err);
  }
}
