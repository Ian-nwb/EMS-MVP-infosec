import mongoose from "mongoose";
import { encryptField, decryptField } from "../utils/crypto.js";

const employeeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },
    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"],
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department reference is required"],
    },
    ssn_encrypted: {
      type: String,
      required: [true, "Government ID / SSN is required"],
      // Automatically encrypt before storing in MongoDB
      set: function (val) {
        if (!val) return val;
        // If already encrypted with 3-part hex format, keep as is
        if (typeof val === "string" && val.split(":").length === 3) {
          return val;
        }
        return encryptField(val);
      },
    },
    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: [0, "Salary must be non-negative"],
    },
    contact_number: {
      type: String,
      trim: true,
      default: "",
    },
    hire_date: {
      type: Date,
      default: Date.now,
    },
    employment_status: {
      type: String,
      enum: ["active", "on_leave", "terminated"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Decrypted SSN getter / helper
employeeSchema.methods.getDecryptedSSN = function () {
  return decryptField(this.ssn_encrypted);
};

// Masked SSN for non-privileged or regular display (e.g. ***-**-1234)
employeeSchema.methods.getMaskedSSN = function () {
  const plain = decryptField(this.ssn_encrypted);
  if (!plain || plain.length < 4) return "****";
  return `***-**-${plain.slice(-4)}`;
};

export const Employee = mongoose.model("Employee", employeeSchema);
