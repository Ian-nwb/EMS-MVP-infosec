import express from "express";
import cors from "cors";
import helmet from "helmet";
import { sanitizeMiddleware } from "./middleware/sanitize.middleware.js";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import superadminRoutes from "./routes/superadmin.routes.js";

import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.middleware.js";

dotenv.config();

const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS policy
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. Request body parser with payload size limitation (DoS protection)
app.use(express.json({ limit: "15kb" }));
app.use(express.urlencoded({ extended: true, limit: "15kb" }));

// 4. NoSQL Query Injection Sanitization (Strips '$' and '.' keys)
app.use(sanitizeMiddleware);

// 5. Global Rate Limiting for API routes
app.use("/api", apiLimiter);

// 6. Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Employee Management System API",
    securityControls: {
      tls: "TLS 1.3 enforced by gateway",
      mongoSanitize: "active",
      rateLimiter: "active",
      helmetHeaders: "active",
      jwtAuth: "active",
      rbac: "active",
      aesEncryption: "active",
    },
  });
});

// 7. API Routes Mounting
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/superadmin", superadminRoutes);

// 8. 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
