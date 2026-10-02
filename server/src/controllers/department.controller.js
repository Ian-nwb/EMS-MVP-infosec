import { z } from "zod";
import { Department } from "../models/Department.js";
import { Employee } from "../models/Employee.js";
import { logAuditEvent } from "../utils/logger.js";

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name must have at least 2 characters").max(100),
  description: z.string().max(500).optional().default(""),
});

export async function getDepartments(req, res, next) {
  try {
    const departments = await Department.find().sort({ name: 1 });
    // Also include employee count for each department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const count = await Employee.countDocuments({ department_id: dept._id });
        return {
          ...dept.toObject(),
          employeeCount: count,
        };
      })
    );
    res.json({ success: true, count: departmentsWithCounts.length, data: departmentsWithCounts });
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const { name, description } = req.body;
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Department already exists" });
    }

    const dept = await Department.create({ name: name.trim(), description: description?.trim() });

    await logAuditEvent({
      action: "DEPARTMENT_CREATE",
      resource: "DEPARTMENT",
      resourceId: dept._id,
      req,
      details: { name: dept.name },
    });

    res.status(201).json({ success: true, message: "Department created", data: dept });
  } catch (err) {
    next(err);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const dept = await Department.findByIdAndUpdate(
      id,
      { name: name.trim(), description: description?.trim() },
      { new: true, runValidators: true }
    );

    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    await logAuditEvent({
      action: "DEPARTMENT_UPDATE",
      resource: "DEPARTMENT",
      resourceId: dept._id,
      req,
      details: { name: dept.name },
    });

    res.json({ success: true, message: "Department updated", data: dept });
  } catch (err) {
    next(err);
  }
}

export async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const assignedEmployees = await Employee.countDocuments({ department_id: id });
    if (assignedEmployees > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department: ${assignedEmployees} employees are currently assigned to it.`,
      });
    }

    const dept = await Department.findByIdAndDelete(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    await logAuditEvent({
      action: "DEPARTMENT_DELETE",
      resource: "DEPARTMENT",
      resourceId: id,
      req,
      details: { name: dept.name },
    });

    res.json({ success: true, message: "Department deleted successfully" });
  } catch (err) {
    next(err);
  }
}
