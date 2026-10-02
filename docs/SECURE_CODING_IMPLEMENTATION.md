# PART 4: Secure Coding Implementation (Prototype)
**Course Project:** Secure System Design, Risk Assessment, and Secure Implementation  
**Target Deliverable:** Source Code Evidence & Screenshot Verification Guide  

---

## Overview

The rubric requires implementing **at least 2** secure coding practices. The EMS prototype implements **all 5** recognized secure coding practices directly in production code:

1. **Input Validation & Allow-List Filtering**
2. **Secure Authentication & Account Lockout**
3. **Password Hashing (No Plaintext Passwords)**
4. **Proper Error Handling & Tamper-Evident Audit Logging**
5. **Access Control Mechanisms (RBAC & Server-Side Ownership)**

---

## 1. Input Validation & Allow-List Filtering

### Implementation Location:
- Middleware: [`server/src/middleware/validate.middleware.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/middleware/validate.middleware.js)
- Schemas: Defined per controller using **Zod** (e.g., [`auth.controller.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/controllers/auth.controller.js#L10-L25), [`employee.controller.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/controllers/employee.controller.js))
- NoSQL Sanitizer: [`server/src/middleware/sanitize.middleware.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/middleware/sanitize.middleware.js)

### Code Evidence:
```javascript
// Strict Zod schema enforcing strong password and valid email format
export const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(100),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  full_name: z.string().min(2).max(100).optional(),
});

// Deep recursive key sanitizer stripping MongoDB injection operators ($ and .)
for (const key of Object.keys(obj)) {
  if (key.startsWith("$") || key.includes(".")) {
    delete obj[key];
  }
}
```

---

## 2. Secure Authentication & Account Lockout

### Implementation Location:
- Model Methods: [`server/src/models/User.js:L48-L75`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/models/User.js#L48-L75)
- Controller: [`server/src/controllers/auth.controller.js:L92-L157`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/controllers/auth.controller.js#L92-L157)
- Rate Limiter: [`server/src/middleware/rateLimit.middleware.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/middleware/rateLimit.middleware.js)

### Code Evidence:
```javascript
// Account Lockout after 5 failed attempts
userSchema.methods.incrementFailedLogins = async function () {
  if (this.lockoutUntil && this.lockoutUntil <= Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockoutUntil = null;
    return this.save();
  }

  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
  }
  return this.save();
};

// Check lockout during login
if (user.isLocked) {
  const minutesRemaining = Math.ceil((user.lockoutUntil - Date.now()) / (60 * 1000));
  return res.status(403).json({
    success: false,
    message: `Account is temporarily locked due to multiple failed attempts. Try again in ${minutesRemaining} minutes.`,
  });
}
```

---

## 3. Password Hashing (Never Plaintext)

### Implementation Location:
- Model & Seed: [`server/src/models/User.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/models/User.js#L48-L50), [`server/src/utils/seed.js:L40-L45`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/utils/seed.js#L40-L45)
- Registration: [`server/src/controllers/auth.controller.js:L54-L60`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/controllers/auth.controller.js#L54-L60)

### Code Evidence:
```javascript
// bcryptjs with salt factor 12 (4,096 rounds)
const salt = await bcrypt.genSalt(12);
const password_hash = await bcrypt.hash(password, salt);

// Compare candidate password securely without exposing hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Exclude password_hash from JSON serialization automatically
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};
```

---

## 4. Proper Error Handling & Immutable Audit Logging

### Implementation Location:
- Centralized Error Handler: [`server/src/middleware/errorHandler.middleware.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/middleware/errorHandler.middleware.js)
- Audit Logger: [`server/src/utils/logger.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/utils/logger.js)
- Audit Model: [`server/src/models/AuditLog.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/models/AuditLog.js)

### Code Evidence:
```javascript
// Centralized Error Handler (No stack trace leaks in production)
export function errorHandler(err, req, res, next) {
  logger.error("Internal Server Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.isOperational ? err.message : "An unexpected internal server error occurred.",
  });
}

// Tamper-Evident Audit Logging for security actions
export async function logAuditEvent({ userId, userEmail, action, resource, resourceId, status, req, details }) {
  await AuditLog.create({
    user_id: userId,
    user_email: userEmail,
    action, // e.g. AUTH_LOGIN_SUCCESS, USER_DELETED, PAYROLL_VIEWED
    resource,
    resource_id: resourceId,
    status, // SUCCESS, FAILURE, DENIED
    ip_address: req?.ip || "unknown",
    user_agent: req?.get("user-agent"),
    details,
  });
}
```

---

## 5. Access Control Mechanisms (RBAC & Server-Side Ownership)

### Implementation Location:
- Auth & RBAC Middleware: [`server/src/middleware/auth.middleware.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/middleware/auth.middleware.js), [`server/src/middleware/rbac.middleware.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/middleware/rbac.middleware.js)
- Ownership Guards: [`server/src/controllers/payroll.controller.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/controllers/payroll.controller.js), [`server/src/controllers/leave.controller.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/controllers/leave.controller.js)

### Code Evidence:
```javascript
// Role-Based Authorization Guard
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to access this resource.",
      });
    }
    next();
  };
}

// Horizontal Privilege Escalation Guard (Ownership Check)
export async function getPayrollById(req, res, next) {
  const payroll = await Payroll.findById(req.params.id);
  // If requesting user is an employee, verify they own the record
  if (req.user.role === "employee" && String(payroll.employee_id.user_id) !== String(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: "Access Denied: You are not authorized to view peer payslips.",
    });
  }
}
```

---

## 6. Screenshots Walkthrough Guide (For Final Report)

To capture screenshots for your submission deck/report, follow this sequence:

| # | Screenshot Target | How to Capture | Security Demonstration |
|---|-------------------|----------------|------------------------|
| **1** | **Bcrypt Hashes in DB** | MongoDB Atlas / Compass view of `users` collection | Proves no plaintext passwords exist in database. |
| **2** | **Account Lockout Alert** | Attempt login with wrong password 5 times at `http://localhost:5173` | Shows lockout error: *"Account locked due to 5 consecutive failed login attempts."* |
| **3** | **Rate Limiter Trigger** | Send rapid requests to `/api/auth/login` | Shows `429 Too Many Requests` defense. |
| **4** | **Superadmin Portal** | Login as `superadmin@ems.com` (`SuperAdmin1!@#`) | Shows dedicated User Management CRUD (add user, edit role, unlock account). |
| **5** | **Audit Trail Log** | Login as `admin@ems.com` and click "Audit Logs" | Shows immutable log entries tracking IP, status, user, and action. |
| **6** | **Encrypted Payslip View** | Login as `employee@ems.com` and open Payslip | Demonstrates AES-256 decrypted voucher with ownership check. |
| **7** | **Logout Confirmation** | Click the Logout button in navbar | Shows the security modal confirming session termination. |
