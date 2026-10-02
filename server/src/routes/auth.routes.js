import express from "express";
import { register, login, getProfile, registerSchema, loginSchema } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes with rate limiting and strict schema validation
router.post("/register", authLimiter, validate({ body: registerSchema }), register);
router.post("/login", authLimiter, validate({ body: loginSchema }), login);

// Protected routes
router.get("/me", authenticate, getProfile);

export default router;
