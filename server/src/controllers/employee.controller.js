import { z } from "zod";
import mongoose from "mongoose";
import { Employee } from "../models/Employee.js";
import { User } from "../models/User.js";
import { Department } from "../models/Department.js";
import { logAuditEvent } from "../utils/logger.js";

// Validation schema for employee creation/update
export const employeeCreateSchema = z.object({
  user_email: z.string().email().optional(),
  full_name: z.string().min(2, "Full name must have at least 2 characters").max(120),
  position: z.string().min(2, "Position must have at least 2 characters").max(100),
  department_id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Valid Department ID required"),
  ssn: z.string().min(4, "SSN / Gov ID must have at least 4 characters").max(30),
  salary: z.number().nonnegative("Salary must be greater than or equal to 0"),
  contact_number: z.string().max(30).optional().default(""),
  employment_status: z.enum(["active", "on_leave", "terminated"]).optional().default("active"),
});

export const employeeUpdateSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  position: z.string().min(2).max(100).optional(),
  department_id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Valid Department ID required").optional(),
  ssn: z.string().min(4).max(30).optional(),
  salary: z.number().nonnegative().optional(),
  contact_number: z.string().max(30).optional(),
  employment_status: z.enum(["active", "on_leave", "terminated"]).optional(),
});

// GET /api/employees (HR: all; Manager: team/department; Employee: self)
export async function getEmployees(req, res, next) {
  try {
    let query = {};

    if (req.user.role === "employee") {
      // Employee can only see their own employee record
      if (!req.user.employeeId) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query._id = req.user.employeeId;
    } else if (req.user.role === "manager") {
      // Manager can see their department's employees or all active
      // If manager has a department assigned, filter by that department
      if (req.user.employee?.department_id) {
        query.department_id = req.user.employee.department_id;
      }
    }

    const employees = await Employee.find(query)
      .populate("department_id", "name")
      .populate("user_id", "email role")
      .sort({ createdAt: -1 });

    const formatted = employees.map((emp) => {
      const doc = emp.toObject();
      // Mask SSN for security unless HR requests full
      doc.ssn_masked = emp.getMaskedSSN();
      delete doc.ssn_encrypted;
      return doc;
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/employees/:id
export async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID format" });
    }

    // Role check: employee can only view self
    if (req.user.role === "employee" && req.user.employeeId !== id) {
      await logAuditEvent({
        action: "UNAUTHORIZED_EMPLOYEE_VIEW",
        resource: "EMPLOYEE",
        resourceId: id,
        status: "DENIED",
        req,
      });
      return res.status(403).json({ success: false, message: "You are not authorized to view this record" });
    }

    const employee = await Employee.findById(id)
      .populate("department_id", "name")
      .populate("user_id", "email role");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const data = employee.toObject();
    data.ssn_masked = employee.getMaskedSSN();
    
    // Only HR with showSensitive flag gets unmasked SSN, and that triggers an audit log
    if (req.user.role === "hr" && req.query.reveal_ssn === "true") {
      data.ssn_unmasked = employee.getDecryptedSSN();
      await logAuditEvent({
        action: "SENSITIVE_SSN_REVEAL",
        resource: "EMPLOYEE",
        resourceId: employee._id,
        req,
        details: { targetEmployeeName: employee.full_name },
      });
    }
    delete data.ssn_encrypted;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// POST /api/employees (HR only)
export async function createEmployee(req, res, next) {
  try {
    const { user_email, full_name, position, department_id, ssn, salary, contact_number, employment_status } = req.body;

    const dept = await Department.findById(department_id);
    if (!dept) {
      return res.status(400).json({ success: false, message: "Specified department does not exist" });
    }

    let linkedUserId = null;
    if (user_email) {
      const user = await User.findOne({ email: user_email.toLowerCase() });
      if (user) {
        // Check if already assigned
        const existingAssigned = await Employee.findOne({ user_id: user._id });
        if (existingAssigned) {
          return res.status(400).json({ success: false, message: "User account is already linked to another employee" });
        }
        linkedUserId = user._id;
      }
    }

    const newEmp = new Employee({
      user_id: linkedUserId,
      full_name,
      position,
      department_id,
      ssn_encrypted: ssn, // Automatically encrypted by model setter
      salary,
      contact_number,
      employment_status,
    });

    await newEmp.save();

    await logAuditEvent({
      action: "EMPLOYEE_CREATE",
      resource: "EMPLOYEE",
      resourceId: newEmp._id,
      req,
      details: { full_name, position, department: dept.name },
    });

    const populated = await Employee.findById(newEmp._id)
      .populate("department_id", "name")
      .populate("user_id", "email role");

    const data = populated.toObject();
    data.ssn_masked = populated.getMaskedSSN();
    delete data.ssn_encrypted;

    res.status(201).json({ success: true, message: "Employee record created successfully", data });
  } catch (err) {
    next(err);
  }
}

// PUT /api/employees/:id (HR or Manager for contact info)
export async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Role restrictions: manager cannot change salary or SSN
    if (req.user.role === "manager") {
      delete updates.salary;
      delete updates.ssn;
    }

    if (updates.ssn) {
      employee.ssn_encrypted = updates.ssn;
      delete updates.ssn;
    }

    Object.assign(employee, updates);
    await employee.save();

    await logAuditEvent({
      action: "EMPLOYEE_UPDATE",
      resource: "EMPLOYEE",
      resourceId: employee._id,
      req,
      details: { updatedFields: Object.keys(updates) },
    });

    const updated = await Employee.findById(id)
      .populate("department_id", "name")
      .populate("user_id", "email role");

    const data = updated.toObject();
    data.ssn_masked = updated.getMaskedSSN();
    delete data.ssn_encrypted;

    res.json({ success: true, message: "Employee updated successfully", data });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/employees/:id (HR only)
export async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    await logAuditEvent({
      action: "EMPLOYEE_DELETE",
      resource: "EMPLOYEE",
      resourceId: id,
      req,
      details: { deletedEmployeeName: employee.full_name },
    });

    res.json({ success: true, message: "Employee record deleted successfully" });
  } catch (err) {
    next(err);
  }
}
