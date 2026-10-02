import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Employee } from "../models/Employee.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is missing from environment variables");
      return res.status(500).json({ success: false, message: "Internal server authentication configuration error" });
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select("-password_hash");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive user account",
      });
    }

    // Attach linked employee record if available
    const employee = await Employee.findOne({ user_id: user._id });

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      role: user.role,
      employeeId: employee ? employee._id.toString() : null,
      employee: employee || null,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired, please log in again",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }
}
