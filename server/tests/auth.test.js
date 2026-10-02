import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/models/User.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/torinvr_test_db";

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret_key_38472918471928472918";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
});

beforeEach(async () => {
  await User.deleteMany({ email: /@test\.com$/ });
});

afterAll(async () => {
  await User.deleteMany({ email: /@test\.com$/ });
  await mongoose.connection.close();
});

describe("Authentication & Password Security", () => {
  test("Rejects registration with weak password lacking complexity", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "weakpass@test.com",
      password: "simple",
      role: "employee",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test("Registers user with strong password and returns JWT", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "secureuser@test.com",
      password: "StrongPassword123!@#",
      role: "employee",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();

    // Verify password is never plaintext in DB
    const saved = await User.findOne({ email: "secureuser@test.com" });
    expect(saved).toBeDefined();
    expect(saved.password_hash).not.toBe("StrongPassword123!@#");
    expect(saved.password_hash.startsWith("$2")).toBe(true); // bcrypt prefix
  });

  test("Successful login with valid credentials", async () => {
    // First register
    await request(app).post("/api/auth/register").send({
      email: "loginuser@test.com",
      password: "StrongPassword123!@#",
      role: "employee",
    });

    // Attempt login
    const res = await request(app).post("/api/auth/login").send({
      email: "loginuser@test.com",
      password: "StrongPassword123!@#",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("loginuser@test.com");
  });

  test("Enforces Account Lockout after 5 consecutive failed login attempts", async () => {
    await request(app).post("/api/auth/register").send({
      email: "lockout@test.com",
      password: "StrongPassword123!@#",
      role: "employee",
    });

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      const res = await request(app).post("/api/auth/login").send({
        email: "lockout@test.com",
        password: "WrongPassword!@#1",
      });
      expect(res.status).toBe(401);
    }

    // 5th failed attempt triggers lockout
    const fifthAttempt = await request(app).post("/api/auth/login").send({
      email: "lockout@test.com",
      password: "WrongPassword!@#1",
    });
    expect(fifthAttempt.status).toBe(401);
    expect(fifthAttempt.body.message).toMatch(/Account locked/);

    // 6th attempt should be blocked with 403 Forbidden due to lockout
    const lockedAttempt = await request(app).post("/api/auth/login").send({
      email: "lockout@test.com",
      password: "StrongPassword123!@#", // Even with right password, account is locked!
    });
    expect(lockedAttempt.status).toBe(403);
    expect(lockedAttempt.body.message).toMatch(/temporarily locked/);
  });
});
