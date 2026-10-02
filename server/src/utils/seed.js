import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Department } from "../models/Department.js";
import { Employee } from "../models/Employee.js";
import { LeaveRequest } from "../models/LeaveRequest.js";
import { Payroll } from "../models/Payroll.js";
import { Attendance } from "../models/Attendance.js";
import { AuditLog } from "../models/AuditLog.js";

export async function seedAccounts() {
  try {
    console.log("Checking and seeding EMS accounts...");

    // 1. Departments
    let engineering = await Department.findOne({ name: "Engineering" });
    if (!engineering) {
      engineering = await Department.create({
        name: "Engineering",
        description: "Software engineering, infrastructure, and systems",
      });
    }

    let hrDept = await Department.findOne({ name: "Human Resources" });
    if (!hrDept) {
      hrDept = await Department.create({
        name: "Human Resources",
        description: "People operations, talent acquisition, and employee relations",
      });
    }

    let finance = await Department.findOne({ name: "Finance & Operations" });
    if (!finance) {
      finance = await Department.create({
        name: "Finance & Operations",
        description: "Financial planning, accounting, and payroll operations",
      });
    }

    // 2. Users and Passwords
    const salt = await bcrypt.genSalt(12);
    const superPass = await bcrypt.hash("SuperAdmin1!@#", salt);
    const hrPass = await bcrypt.hash("Admin123!@#", salt);
    const mgrPass = await bcrypt.hash("Manager123!@#", salt);
    const empPass = await bcrypt.hash("Employee123!@#", salt);

    const accountsToSeed = [
      { email: "superadmin@ems.com", password_hash: superPass, role: "superadmin", name: "Super Administrator", pos: "System Superadmin", dept: hrDept },
      { email: "admin@ems.com", password_hash: hrPass, role: "hr", name: "Administrator", pos: "HR Administrator", dept: hrDept },
      { email: "hr@ems.com", password_hash: hrPass, role: "hr", name: "Eleanor Vance", pos: "HR Director", dept: hrDept },
      { email: "manager@ems.com", password_hash: mgrPass, role: "manager", name: "Marcus Sterling", pos: "Engineering Manager", dept: engineering },
      { email: "employee@ems.com", password_hash: empPass, role: "employee", name: "Sarah Chen", pos: "Senior Software Engineer", dept: engineering },
    ];

    for (const acc of accountsToSeed) {
      let user = await User.findOne({ email: acc.email.toLowerCase() });
      if (!user) {
        user = await User.create({
          email: acc.email.toLowerCase(),
          password_hash: acc.password_hash,
          role: acc.role,
        });
      } else {
        // Sync password hash, role and reset lockout so seeded accounts always match accounts.txt
        user.password_hash = acc.password_hash;
        user.role = acc.role;
        user.failedLoginAttempts = 0;
        user.lockoutUntil = null;
        user.isActive = true;
        await user.save();
      }

      // Link employee
      let employee = await Employee.findOne({ user_id: user._id });
      if (!employee) {
        employee = await Employee.create({
          user_id: user._id,
          full_name: acc.name,
          position: acc.pos,
          department_id: acc.dept._id,
          ssn_encrypted: "987-65-4321",
          salary: acc.role === "hr" ? 115000 : acc.role === "manager" ? 130000 : 98000,
          contact_number: "+1 (555) 234-5678",
          employment_status: "active",
        });
      }
    }

    // Ensure sample leave requests exist
    const staffEmp = await Employee.findOne({ full_name: "Sarah Chen" });
    const mgrUser = await User.findOne({ email: "manager@ems.com" });

    if (staffEmp) {
      const existingLeave = await LeaveRequest.findOne({ employee_id: staffEmp._id });
      if (!existingLeave) {
        await LeaveRequest.create({
          employee_id: staffEmp._id,
          leave_type: "vacation",
          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          reason: "Annual family retreat and recharge.",
          status: "pending",
        });

        await LeaveRequest.create({
          employee_id: staffEmp._id,
          leave_type: "sick",
          start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          reason: "Flu recovery.",
          status: "approved",
          reviewed_by: mgrUser ? mgrUser._id : null,
          reviewer_notes: "Approved.",
        });
      }

      // Ensure payroll records exist
      const existingPay = await Payroll.findOne({ employee_id: staffEmp._id });
      if (!existingPay) {
        await Payroll.create({
          employee_id: staffEmp._id,
          basic_salary: 8166.67,
          allowances: 500,
          deductions: 1200,
          net_pay: 7466.67,
          pay_period: "September 2026",
          pay_date: new Date("2026-09-30"),
          status: "paid",
        });

        await Payroll.create({
          employee_id: staffEmp._id,
          basic_salary: 8166.67,
          allowances: 500,
          deductions: 1200,
          net_pay: 7466.67,
          pay_period: "October 2026",
          pay_date: new Date("2026-10-31"),
          status: "processed",
        });
      }

      // Ensure attendance entry exists
      const existingAtt = await Attendance.findOne({ employee_id: staffEmp._id });
      if (!existingAtt) {
        await Attendance.create({
          employee_id: staffEmp._id,
          date: new Date(),
          check_in: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: "present",
          notes: "On-time arrival",
        });
      }
    }

    console.log("EMS accounts seeded successfully!");
  } catch (err) {
    console.error("Error seeding accounts:", err.message);
  }
}

export const seedDemoData = seedAccounts;
