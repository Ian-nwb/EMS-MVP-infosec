import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password_hash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      enum: ["superadmin", "hr", "manager", "employee"],
      default: "employee",
      required: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property to check if account is currently locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockoutUntil && this.lockoutUntil > Date.now());
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Handle failed login attempt (lockout after 5 failed attempts for 15 minutes)
userSchema.methods.incrementFailedLogins = async function () {
  // If lockout expired, reset
  if (this.lockoutUntil && this.lockoutUntil <= Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockoutUntil = null;
    return this.save();
  }

  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
  }
  return this.save();
};

// Reset failed login counter on success
userSchema.methods.resetFailedLogins = async function () {
  if (this.failedLoginAttempts > 0 || this.lockoutUntil) {
    this.failedLoginAttempts = 0;
    this.lockoutUntil = null;
    return this.save();
  }
};

// Omit password hash in JSON serialization
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

export const User = mongoose.model("User", userSchema);
