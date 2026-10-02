import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
    },
    basic_salary: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: [0, "Basic salary must be non-negative"],
    },
    allowances: {
      type: Number,
      default: 0,
      min: [0, "Allowances must be non-negative"],
    },
    deductions: {
      type: Number,
      default: 0,
      min: [0, "Deductions must be non-negative"],
    },
    net_pay: {
      type: Number,
      required: [true, "Net pay is required"],
    },
    pay_period: {
      type: String,
      required: [true, "Pay period is required"],
      trim: true,
    },
    pay_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["draft", "processed", "paid"],
      default: "processed",
    },
  },
  {
    timestamps: true,
  }
);

export const Payroll = mongoose.model("Payroll", payrollSchema);
