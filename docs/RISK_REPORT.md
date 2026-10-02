# Risk Management Analysis & Threat Assessment

**Project:** Secure Employee Management System (EMS)  
**Evaluation Scope:** Information Security, Risk Analysis, and Secure Implementation (Rubric Part 2 — 25%)  
**Target Environment:** MERN Stack · MongoDB Atlas (`torinvr_db`) · Express.js · React · Node.js  

---

## 1. Asset Identification & Classification (≥5 Assets)

Assets were identified across data, infrastructure, and application tiers, and classified by their Confidentiality, Integrity, and Availability (CIA) sensitivity.

| # | Asset Name | Description & Storage Location | Sensitivity | CIA Priority |
|---|------------|--------------------------------|-------------|--------------|
| **1** | **User Credentials** | Bcrypt password hashes, salt parameters, and active JWT signing secrets stored in environment variables and MongoDB `users` collection. | **Critical** | **C · I** |
| **2** | **PII & Government IDs** | Social Security Numbers (SSN), Tax IDs, and home contacts stored in MongoDB `employees` collection. | **Critical** | **C** |
| **3** | **Compensation & Payroll Records** | Basic salaries, statutory deductions, bonuses, and net payments stored in `payrolls` collection. | **High** | **C · I** |
| **4** | **Application Source & Config** | Git repository, environment variables (`MONGODB_URI`, `JWT_SECRET`), and runtime dependencies. | **High** | **I · A** |
| **5** | **Audit Trail Logs** | Immutable system event records, access denial records, and PII reveal history in `audit_logs`. | **High** | **I · A** |
| **6** | **Cloud Database & Hosting** | MongoDB Atlas cluster (`tori.h1nyjfo.mongodb.net`), Node.js runtime process, and TLS endpoints. | **Medium** | **A · I** |

---

## 2. Threats & Vulnerabilities Identification (≥5 Each)

### Threats (Potential Malicious or Accidental Adversaries)
1. **NoSQL Query Operator Injection:** An attacker provides malicious MongoDB operators (`$ne`, `$gt`, `$or`) in JSON input to bypass authentication or extract unauthorized records.
2. **Credential Stuffing & Brute-Force Attacks:** Automated botnets repeatedly attempt login combinations against corporate email accounts to gain unauthorized access.
3. **Privilege Escalation / Horizontal Insecure Direct Object References (IDOR):** An authenticated employee manipulates API request parameters (e.g. `GET /api/payroll/:id`) to snoop on executive salaries or peer records.
4. **Data Exfiltration / PII Snooping at Rest:** Unauthorized administrators or compromised database snapshots leaking raw Social Security Numbers.
5. **Denial of Service (DoS) via Payload Flooding:** Adversaries sending massive request bodies (>1MB) to deplete server memory and CPU cycles.
6. **Token Hijacking & Replay:** Stolen session tokens reused by unauthorized parties if token expiration is excessively long.

### Vulnerabilities (System Weaknesses)
1. **Unsanitized Request Parameters:** Default Express handlers accepting arbitrary object keys without schema validation.
2. **Lack of Account Lockout Thresholds:** Allowing unbounded failed password attempts without temporary rate limiting or lockouts.
3. **Plaintext Storage of Sensitive Identifiers:** Storing SSNs or salaries in plaintext within MongoDB documents.
4. **Verbose Stack Trace Exposure:** Default development error pages returning internal database error messages, stack traces, and collection schemas.
5. **Over-permissive CORS & Missing Security Headers:** Lack of Content Security Policy (CSP), clickjacking protection (X-Frame-Options), or open origin wildcards (`*`).
6. **Hardcoded Secrets in Version Control:** Committing `.env` connection strings with Atlas database passwords into public/private repositories.

---

## 3. Quantitative & Qualitative Risk Assessment Matrix

$$\text{Risk Level} = \text{Likelihood} \times \text{Vulnerability Severity} \times \text{Business Impact}$$

| Identified Risk Scenario | Likelihood | Impact | Severity Score | Inherent Risk Level | Target Treatment Strategy | Residual Risk |
|---|:---:|:---:|:---:|:---:|---|:---:|
| **NoSQL Injection leading to DB Dump** | Medium | Critical | High (16) | **HIGH** | **Mitigate:** Zod validation + custom recursive key sanitizer + typed Mongoose schemas | **Low** |
| **Credential Brute-Force on Login** | High | High | High (15) | **HIGH** | **Mitigate:** 15-minute lockout after 5 failures + `express-rate-limit` (10/15min) + Bcrypt cost 12 | **Low** |
| **PII / SSN Data Leak from DB Backup** | Medium | Critical | High (16) | **HIGH** | **Mitigate:** AES-256-GCM cipher encryption at rest with random IVs per record | **Low** |
| **IDOR Access to Peer Payslips** | Medium | High | Medium (12) | **MEDIUM** | **Mitigate:** Server-side ownership validation guards on `/api/payroll/:id` | **Low** |
| **Uncaught Server Error Leaks Stack** | High | Medium | Medium (10) | **MEDIUM** | **Mitigate:** Centralized error handler returning generic user messages | **Low** |
| **Cloud Infrastructure Hardware Failure** | Low | High | Low (6) | **LOW** | **Transfer:** MongoDB Atlas SLA, automated replicas, and local resilient fallback | **Low** |
| **Distributed Denial of Service (DDoS)** | Low | Medium | Low (4) | **LOW** | **Accept (Documented):** Standard rate limiting in place; enterprise CDN acceptable for prod | **Low** |

---

## 4. Risk Treatment Strategies (Rubric Part 2 Requirement: ≥2 Strategies)

### Strategy 1: Risk Mitigation (Technical & Architectural Controls)
1. **Cryptographic Mitigation:**
   - Passwords hashed using `bcryptjs` with salt rounds = 12.
   - PII (SSN) automatically encrypted before insertion using AES-256-GCM authenticated encryption; decryption is restricted to HR role with mandatory audit logging.
2. **Input Validation & Sanitization:**
   - Every route parameter and body payload is validated using strict Zod schemas.
   - Recursive sanitization middleware automatically detects and strips keys with `$` or `.` prefixes before controllers execute.
3. **Defensive Access Controls:**
   - Strict RBAC matrix (`hr`, `manager`, `employee`).
   - Ownership verification ensures employees can never view another employee's records even if they manipulate URL IDs.
4. **Brute-Force & Lockout Controls:**
   - 5 consecutive failed login attempts trigger an immediate 15-minute account lockout.
   - Public authentication endpoints are limited to 10 requests per 15 minutes per IP.

### Strategy 2: Risk Transfer (Platform & SLA Governance)
1. **Managed Database Infrastructure:**
   - Primary database operations are hosted on **MongoDB Atlas**, transferring physical server hardening, hardware maintenance, network firewall patches, and automated encrypted storage to MongoDB's SOC-2 Type II certified platform.
2. **Resilient Local Architecture:**
   - A local replica daemon fallback ensures continuous development and testing continuity if external network routing or DNS SRV resolution is disrupted.

### Strategy 3: Documented Risk Acceptance
1. **Large-Scale Multi-Gigabit DDoS:**
   - For academic evaluation and internal corporate deployment, multi-layer volumetric DDoS mitigation (e.g. Cloudflare Magic Transit / AWS Shield Advanced) is deemed cost-prohibitive and formally accepted. Standard gateway rate limiters (200 req/15min) and request body limits (15KB) provide baseline defense.
