import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { Employee } from "../models/Employee.js";
import { logAuditEvent } from "../utils/logger.js";

// ── Validation schemas ─────────────────────────────────────────────────────
export const createUserSchema = z.object({
  email: z.string().email().max(100),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Needs uppercase")
    .regex(/[a-z]/, "Needs lowercase")
    .regex(/[0-9]/, "Needs number")
    .regex(/[^A-Za-z0-9]/, "Needs special char"),
  role: z.enum(["superadmin", "hr", "manager", "employee"]),
  full_name: z.string().min(2).max(100).optional(),
});

export const updateUserSchema = z.object({
  role: z.enum(["superadmin", "hr", "manager", "employee"]).optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/)
    .optional(),
});

// ── GET /api/superadmin/users ──────────────────────────────────────────────
export async function listUsers(req, res, next) {
  try {
    const users = await User.find({}, "-password_hash").lean();
    // Attach employee name if linked
    const result = await Promise.all(
      users.map(async (u) => {
        const emp = await Employee.findOne({ user_id: u._id }, "full_name position department_id").populate("department_id", "name").lean();
        return { ...u, employee: emp || null };
      })
    );
    res.json({ success: true, users: result });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/superadmin/users ─────────────────────────────────────────────
export async function createUser(req, res, next) {
  try {
    const { email, password, role, full_name } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: "Email already in use." });

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: email.toLowerCase(), password_hash, role });

    await logAuditEvent({
      userId: req.user.id, userEmail: req.user.email,
      action: "SUPERADMIN_CREATE_USER", resource: "USER", resourceId: user._id,
      status: "SUCCESS", req, details: { targetEmail: user.email, role },
    });

    res.status(201).json({ success: true, message: "User created.", user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/superadmin/users/:id ─────────────────────────────────────────
export async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const { role, isActive, password } = req.body;
    const changes = {};

    if (role !== undefined) { user.role = role; changes.role = role; }
    if (isActive !== undefined) { user.isActive = isActive; changes.isActive = isActive; }
    if (password) {
      user.password_hash = await bcrypt.hash(password, 12);
      changes.passwordReset = true;
    }

    // Reset lockout if reactivating
    if (isActive === true) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
    }

    await user.save();

    await logAuditEvent({
      userId: req.user.id, userEmail: req.user.email,
      action: "SUPERADMIN_UPDATE_USER", resource: "USER", resourceId: user._id,
      status: "SUCCESS", req, details: { targetEmail: user.email, changes },
    });

    res.json({ success: true, message: "User updated.", user: { id: user._id, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/superadmin/users/:id ──────────────────────────────────────
export async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Unlink employee record
    await Employee.findOneAndUpdate({ user_id: req.params.id }, { $unset: { user_id: 1 } });

    await logAuditEvent({
      userId: req.user.id, userEmail: req.user.email,
      action: "SUPERADMIN_DELETE_USER", resource: "USER", resourceId: req.params.id,
      status: "SUCCESS", req, details: { targetEmail: user.email },
    });

    res.json({ success: true, message: "User deleted." });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/superadmin/users/:id/unlock ─────────────────────────────────
export async function unlockUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    await logAuditEvent({
      userId: req.user.id, userEmail: req.user.email,
      action: "SUPERADMIN_UNLOCK_USER", resource: "USER", resourceId: user._id,
      status: "SUCCESS", req, details: { targetEmail: user.email },
    });

    res.json({ success: true, message: "User account unlocked." });
  } catch (err) {
    next(err);
  }
}
