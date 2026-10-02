import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User } from "../src/models/User.js";
import { Employee } from "../src/models/Employee.js";
import { Department } from "../src/models/Department.js";
import { Payroll } from "../src/models/Payroll.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/torinvr_test_db";

let empUser1, empUser2, empRecord1, empRecord2;
let token1, token2;
let payslip1;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret_key_38472918471928472918";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }

  const dept = await Department.create({ name: "Testing Payroll Dept" });

  empUser1 = await User.create({
    email: "emp1@test.com",
    password_hash: "dummyhash",
    role: "employee",
  });
  empRecord1 = await Employee.create({
    user_id: empUser1._id,
    full_name: "Employee One",
    position: "QA Engineer",
    department_id: dept._id,
    ssn_encrypted: "111-22-3333",
    salary: 60000,
  });
  token1 = jwt.sign({ id: empUser1._id, email: empUser1.email, role: "employee" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  empUser2 = await User.create({
    email: "emp2@test.com",
    password_hash: "dummyhash",
    role: "employee",
  });
  empRecord2 = await Employee.create({
    user_id: empUser2._id,
    full_name: "Employee Two",
    position: "DevOps Engineer",
    department_id: dept._id,
    ssn_encrypted: "444-55-6666",
    salary: 75000,
  });
  token2 = jwt.sign({ id: empUser2._id, email: empUser2.email, role: "employee" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  payslip1 = await Payroll.create({
    employee_id: empRecord1._id,
    basic_salary: 5000,
    allowances: 200,
    deductions: 500,
    net_pay: 4700,
    pay_period: "September 2026",
    status: "paid",
  });
});

afterAll(async () => {
  await User.deleteMany({ email: /@test\.com$/ });
  await Employee.deleteMany({ full_name: /Employee (One|Two)/ });
  await Department.deleteMany({ name: /Testing Payroll Dept/ });
  await Payroll.deleteMany({});
  await mongoose.connection.close();
});

describe("Payroll Ownership & Confidentiality Access Control", () => {
  test("Employee One CAN view their own payslip", async () => {
    const res = await request(app)
      .get(`/api/payroll/${payslip1._id}`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.net_pay).toBe(4700);
  });

  test("Employee Two is FORBIDDEN (403) from viewing Employee One's payslip", async () => {
    const res = await request(app)
      .get(`/api/payroll/${payslip1._id}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot view another employee's payslip/);
  });
});
