import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    check_in: {
      type: Date,
      default: Date.now,
    },
    check_out: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["present", "late", "absent", "half_day"],
      default: "present",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Notes cannot exceed 200 characters"],
    },
  },
  {
    timestamps: true,
  }
);

export const Attendance = mongoose.model("Attendance", attendanceSchema);
