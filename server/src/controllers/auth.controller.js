import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { Employee } from "../models/Employee.js";
import { Department } from "../models/Department.js"; // required for populate to resolve ref
import { logAuditEvent } from "../utils/logger.js";

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(100),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  full_name: z.string().min(2).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Helper: Issue JWT
function issueToken(user) {
  const secret = process.env.JWT_SECRET;
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: "4h" } // Short-lived JWT as per security guidelines
  );
}

// Register Controller
export async function register(req, res, next) {
  try {
    const { email, password, role, full_name } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const salt = await bcrypt.genSalt(12); // Cost >= 10
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: email.toLowerCase(),
      password_hash,
      role: "employee", // Self-registration always gets employee role
    });

    await logAuditEvent({
      userId: user._id,
      userEmail: user.email,
      action: "USER_REGISTERED",
      resource: "USER",
      resourceId: user._id,
      status: "SUCCESS",
      req,
      details: { role: user.role },
    });

    const token = issueToken(user);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Login Controller with Account Lockout & Audit Logging
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Use typed object query to prevent NoSQL operator injection
    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user) {
      await logAuditEvent({
        action: "AUTH_LOGIN_FAILED",
        resource: "AUTH",
        status: "FAILURE",
        req,
        details: { attemptedEmail: email, reason: "User not found" },
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account lockout
    if (user.isLocked) {
      const minutesRemaining = Math.ceil((user.lockoutUntil - Date.now()) / (60 * 1000));
      await logAuditEvent({
        userId: user._id,
        userEmail: user.email,
        action: "AUTH_LOGIN_LOCKED_ATTEMPT",
        resource: "AUTH",
        status: "DENIED",
        req,
        details: { minutesRemaining },
      });
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed attempts. Try again in ${minutesRemaining} minutes.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementFailedLogins();
      const attemptsRemaining = Math.max(0, 5 - user.failedLoginAttempts);

      await logAuditEvent({
        userId: user._id,
        userEmail: user.email,
        action: "AUTH_LOGIN_FAILED",
        resource: "AUTH",
        status: "FAILURE",
        req,
        details: { attemptsRemaining },
      });

      return res.status(401).json({
        success: false,
        message:
          attemptsRemaining > 0
            ? `Invalid email or password. ${attemptsRemaining} attempts remaining before account lockout.`
            : "Account locked due to 5 consecutive failed login attempts. Try again in 15 minutes.",
      });
    }

    // Successful login: reset failures and issue token
    await user.resetFailedLogins();

    const token = issueToken(user);
    const employee = await Employee.findOne({ user_id: user._id }).populate("department_id", "name");

    await logAuditEvent({
      userId: user._id,
      userEmail: user.email,
      action: "AUTH_LOGIN_SUCCESS",
      resource: "AUTH",
      resourceId: user._id,
      status: "SUCCESS",
      req,
      details: { role: user.role },
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employee: employee
          ? {
              id: employee._id,
              full_name: employee.full_name,
              position: employee.position,
              department: employee.department_id?.name || "Unassigned",
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Get current user profile
export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("-password_hash");
    const employee = await Employee.findOne({ user_id: req.user.id }).populate("department_id", "name");

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employee: employee || null,
      },
    });
  } catch (err) {
    next(err);
  }
}
