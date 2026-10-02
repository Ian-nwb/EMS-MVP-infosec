import { logger } from "../utils/logger.js";

// Not Found Handler
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

// Global Centralized Error Handler (Does not leak stack traces or internal details)
export function errorHandler(err, req, res, next) {
  // Log full error internally for developers / operators
  logger.error("Internal Server Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Handle Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format for field '${err.path}'`,
    });
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // Default generic safe response (Never leak stack trace to clients)
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "An internal server error occurred. Please contact support." : err.message,
  });
}
