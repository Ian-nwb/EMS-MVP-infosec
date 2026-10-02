import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User } from "../src/models/User.js";
import { Department } from "../src/models/Department.js";
import { AuditLog } from "../src/models/AuditLog.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/torinvr_test_db";

let hrToken = "";
let employeeToken = "";

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret_key_38472918471928472918";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }

  // Create HR user
  const hrUser = await User.create({
    email: "hr_rbac@test.com",
    password_hash: "$2a$12$fakehashforunittest",
    role: "hr",
  });
  hrToken = jwt.sign({ id: hrUser._id, email: hrUser.email, role: hrUser.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  // Create Employee user
  const empUser = await User.create({
    email: "emp_rbac@test.com",
    password_hash: "$2a$12$fakehashforunittest",
    role: "employee",
  });
  employeeToken = jwt.sign({ id: empUser._id, email: empUser.email, role: empUser.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
});

afterAll(async () => {
  await User.deleteMany({ email: /@test\.com$/ });
  await Department.deleteMany({ name: /Test/ });
  await AuditLog.deleteMany({});
  await mongoose.connection.close();
});

describe("Role-Based Access Control (RBAC)", () => {
  test("Rejects unauthenticated requests to protected endpoints with 401", async () => {
    const res = await request(app).get("/api/departments");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("Allows all authenticated users to read departments", async () => {
    const res = await request(app)
      .get("/api/departments")
      .set("Authorization", `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Blocks Employee from creating a Department with 403 Forbidden and logs audit entry", async () => {
    const res = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        name: "Test Dept Unauthorized",
        description: "Employee trying to create a dept",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Forbidden/);

    // Verify audit log recorded the denied access
    const auditRecord = await AuditLog.findOne({ action: "RBAC_ACCESS_DENIED" });
    expect(auditRecord).toBeDefined();
    expect(auditRecord.status).toBe("DENIED");
  });

  test("Allows HR role to create a Department with 201 Created", async () => {
    const res = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        name: "Test Security Operations",
        description: "HR creating a valid department",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Security Operations");
  });
});
