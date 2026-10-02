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

  await User.create({
    email: "target_victim@test.com",
    password_hash: "$2a$12$dummyhashforinjectionsuite",
    role: "hr",
  });
});

afterAll(async () => {
  await User.deleteMany({ email: /@test\.com$/ });
  await mongoose.connection.close();
});

describe("Injection & Fuzz Testing Mitigation", () => {
  test("Mitigates NoSQL Injection: Rejects login bypass with $ne operator object", async () => {
    // Classic NoSQL injection payload: { email: { "$ne": "" }, password: { "$ne": "" } }
    const maliciousPayload = {
      email: { $ne: "" },
      password: { $ne: "" },
    };

    const res = await request(app).post("/api/auth/login").send(maliciousPayload);

    // Should be rejected by Zod schema validation (expecting string, got object)
    // or sanitized by mongoSanitize
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("Mitigates NoSQL Injection: Strips nested $gt operator queries", async () => {
    const maliciousPayload = {
      email: "target_victim@test.com",
      password: { $gt: "" },
    };

    const res = await request(app).post("/api/auth/login").send(maliciousPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("Rejects malformed JSON and over-sized payloads (>15KB) gracefully with generic error", async () => {
    const hugePayload = {
      email: "spam@test.com",
      password: "A".repeat(25000), // Exceeds 15kb limit
    };

    const res = await request(app).post("/api/auth/login").send(hugePayload);

    // Payload Too Large / Bad Request
    expect([400, 413]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});
