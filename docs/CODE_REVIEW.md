# Code Review Findings & STRIDE-Lite Threat Model

**Project:** Secure Employee Management System (EMS)  
**Rubric Component:** Part 5 — Code Review & Threat Modeling (15 Points)  
**Target Stack:** Node.js · Express.js · MongoDB Atlas · React  

---

## 1. Documented Code Review Security Findings (≥2 Issues & Fixes)

During static security analysis and integration review of the EMS codebase, two critical security vulnerabilities were discovered and resolved:

### Finding 1: NoSQL Operator Injection Bypass via Object Queries (CRITICAL)

#### Vulnerability Description:
In standard Express/Mongo applications, if request payloads are not strictly typed or sanitized, an attacker can transmit JSON objects containing MongoDB query selectors like `{ "email": { "$ne": null }, "password": { "$ne": null } }`. When passed directly to Mongoose or native drivers, `$ne` evaluates to true for non-empty records, allowing unauthorized authentication without credentials.

#### Vulnerable Code (Before Fix):
```javascript
// VULNERABLE: Accepts raw object directly into query
export async function login(req, res) {
  const { email, password } = req.body;
  // If email is { "$ne": null }, query matches any user!
  const user = await User.findOne({ email });
  if (user && await user.comparePassword(password)) {
    // Authenticated bypass!
  }
}
```

#### Remediation Implemented (After Fix):
1. **Zod Validation Schema:** Explicitly validates that `email` and `password` are scalar strings, immediately rejecting any nested object payload with a 400 Bad Request.
2. **Recursive Operator Sanitization Middleware:** Middleware recursively inspects `req.body`, `req.params`, and `req.query`, completely stripping any keys containing `$` or `.`.
3. **Explicit String Coercion:** The controller explicitly coerces the query parameter to `String(email).toLowerCase()`.

```javascript
// REMEDIATED: In server/src/middleware/sanitize.middleware.js & auth.controller.js
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Deep recursive key stripping
for (const key of Object.keys(obj)) {
  if (key.startsWith("$") || key.includes(".")) {
    console.warn(`[Security Alert] Sanitized suspicious key '${key}'`);
    delete obj[key];
  }
}

// Controller enforces typed scalar query
const user = await User.findOne({ email: String(email).toLowerCase() });
```
**Verification:** Validated by automated test suite in [injection.test.js](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/tests/injection.test.js).

---

### Finding 2: Sensitive Stack Trace & Schema Leakage via Unhandled Exceptions (HIGH)

#### Vulnerability Description:
When unhandled errors occurred (such as database connectivity timeouts, Mongoose `CastError`, or validation parsing errors), the default error handlers returned full stack traces, internal file paths (`/server/src/controllers/...`), and database connection metadata to HTTP clients. This reconnaissance data assists adversaries in tailoring targeted attacks.

#### Vulnerable Code (Before Fix):
```javascript
// VULNERABLE: Direct error echo leaking stack trace
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack, // LEAKS SOURCE CODE PATHS & INTERNAL DB DRIVERS
    details: err
  });
});
```

#### Remediation Implemented (After Fix):
A centralized, hardened error handler was implemented in `server/src/middleware/errorHandler.middleware.js`:
1. Internal stack traces are logged only on the server console using structured logger `logger.error()`.
2. Clients receive sanitized, generic error descriptions.
3. Known operational errors (such as duplicate keys `11000` or malformed ObjectIds `CastError`) are translated to clean user-friendly HTTP codes without exposing internal database schema details.

```javascript
// REMEDIATED: In server/src/middleware/errorHandler.middleware.js
export function errorHandler(err, req, res, next) {
  logger.error("Internal Server Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format for field '${err.path}'`,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 
      ? "An internal server error occurred. Please contact support." 
      : err.message,
  });
}
```

---

## 2. STRIDE-Lite Threat Modeling

Each category of the STRIDE model is mapped directly to implemented defensive controls within the Neverio EMS architecture:

| STRIDE Threat Category | Potential Attack Vector | Implemented Security Control & Location |
|---|---|---|
| **S — Spoofing Identity** | Adversary steals or guesses employee passwords, or forges fake JWT session tokens. | **Controls:** Bcrypt password hashing (cost 12), signed HMAC-SHA256 JWT with short expiration (4 hours), and account lockout after 5 consecutive failed logins. [`auth.controller.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/controllers/auth.controller.js) |
| **T — Tampering with Data** | Attacker injects NoSQL operators into parameters or modifies salary records during transit. | **Controls:** TLS 1.3 encryption in transit; deep NoSQL operator sanitization; Zod schema input validation; Mongoose strictly typed fields. [`sanitize.middleware.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/middleware/sanitize.middleware.js) |
| **R — Repudiation** | An administrator decrypts and views sensitive SSN numbers, then denies having accessed employee PII. | **Controls:** Dedicated immutable Audit Logging collection (`AuditLog`). SSN unmasking requires explicit confirmation and logs administrator identity, IP address, and timestamp. [`audit.controller.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/controllers/audit.controller.js) |
| **I — Information Disclosure** | Unauthorized staff reads executive salaries; database theft exposes raw Social Security Numbers. | **Controls:** AES-256-GCM authenticated cipher encryption for sensitive fields at rest; RBAC middleware gating endpoints; server-side ownership checks on payslips. [`crypto.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/utils/crypto.js) |
| **D — Denial of Service** | Volumetric HTTP requests flood the login endpoint; massive JSON payloads (>50MB) exhaust server RAM. | **Controls:** Gateway rate limiting (`express-rate-limit`) on `/api` (200 req/15min) and strict limits on `/api/auth` (10 req/15min); Express body parser constrained to 15KB. [`rateLimit.middleware.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/middleware/rateLimit.middleware.js) |
| **E — Elevation of Privilege** | An authenticated regular employee calls administrative endpoints (`POST /api/departments` or `POST /api/payroll`). | **Controls:** Role-Based Access Control (`authorizeRoles("hr")`) guard middleware verified on every protected route. [`rbac.middleware.js`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/src/middleware/rbac.middleware.js) |
