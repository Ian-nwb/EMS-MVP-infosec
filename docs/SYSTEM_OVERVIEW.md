# PART 1: System Overview Documentation
**Course Project:** Secure System Design, Risk Assessment, and Secure Implementation  
**System Title:** Secure Employee Management System (EMS)  
**Deliverable Length:** 2–3 Pages Equivalent  

---

## 1. System Title and Purpose

### Title
**Secure Employee Management System (EMS)** — An Enterprise-Grade Human Resource & Access Control Platform.

### Purpose
The Employee Management System (EMS) is a secure, modern web-based management information system engineered for organizations to securely administer employee records, organizational departments, attendance tracking, leave request lifecycles, and payroll distribution.

The system is built upon **Security by Design** principles, ensuring that security controls are not retrofitted as an afterthought, but are integral to the architecture from the very first line of code. It solves the critical corporate challenge of preventing unauthorized data exfiltration, horizontal and vertical privilege escalation, and credential stuffing while streamlining HR operations.

---

## 2. Target Users & Personas

The system enforces strict role-based separation of duties across four distinct organizational personas:

| User Role | Target Persona | Key Responsibilities & Capabilities |
|-----------|----------------|-------------------------------------|
| **Superadmin** | Chief Security Officer / System Admin | • Dedicated system administration and governance.<br>• Full User Management CRUD (view all accounts, create users, modify roles).<br>• Account security control (manual account unlock upon lockout, activate/deactivate users).<br>• Isolated from operational employee/HR widgets for strict separation of duties. |
| **HR Administrator** | HR Director / Payroll Officer | • Full operational CRUD on employee personal and employment profiles.<br>• Department structure and budget configuration.<br>• Payroll calculation and voucher issuance with AES-256-GCM encryption.<br>• Global leave review and approval authority.<br>• Real-time inspection of immutable system audit trails. |
| **Manager** | Department Head / Team Lead | • Visibility restricted to team members within their specific department.<br>• Departmental attendance and workday oversight.<br>• Review, approve, or reject employee leave requests with mandatory decision notes. |
| **Employee** | General Staff / Software Engineer | • Self-service portal to view personal employment details.<br>• Submit leave requests (Annual, Sick, Emergency, Unpaid) and track approval status.<br>• Punch daily attendance (clock in / clock out).<br>• Secure access to personal encrypted payslips with server-side ownership enforcement. |

---

## 3. System Features

### A. Authentication & Credential Security
- **Bcrypt Password Hashing:** Cost factor 12 (4,096 iterations) prevents offline dictionary and rainbow table cracking.
- **Account Lockout Protection:** Automatically locks user accounts for 15 minutes upon 5 consecutive failed login attempts, defeating automated credential stuffing.
- **Short-Lived Signed JWTs:** Stateless JSON Web Tokens with a 4-hour lifespan signed with HMAC-SHA256.
- **Dual-Layer Rate Limiting:** Dedicated rate limiters on authentication endpoints (mitigating brute force) and global API endpoints (mitigating DoS).
- **Hardened Self-Registration:** Public registration strictly forces the `employee` role, preventing unauthorized role escalation during sign-up.

### B. Superadmin User Management CRUD
- Real-time tabular overview of all system accounts (email, employee name, assigned role, account status, lockout state).
- Account creation modal supporting explicit role assignment (`superadmin`, `hr`, `manager`, `employee`).
- Inline role modification and one-click account activation/deactivation.
- Instant administrative lockout bypass for locked user accounts.
- Protection against self-deletion.

### C. Employee Lifecycle & Profile Management
- Comprehensive employee records: Full Name, Job Title, Department Assignment, Contact Information, Hire Date, Employment Status, and Government Identifiers.
- Automatic linkage between user authentication credentials and employee operational records.
- Complete search, filter, and sorting capabilities.

### D. Department & Hierarchical Management
- Department definitions with unique name validation and organizational descriptions.
- Assignment of designated Department Managers for decentralized workflow approvals.
- Real-time aggregate employee count per department.

### E. Leave Request Workflow Engine
- Support for multiple leave types: Annual, Sick, Emergency, Maternity/Paternity, and Unpaid.
- Date range calculations with business day tracking.
- Three-state workflow: `Pending` → `Approved` or `Rejected`.
- Department manager review with contextual approval/rejection remarks.

### F. Payroll Management & Encrypted Payslips
- Server-side net salary computation formula:
  $$\text{Net Pay} = \text{Basic Salary} + \text{Allowances} - \text{Statutory Deductions}$$
- Field-level AES-256-GCM encryption for stored salary numbers and Social Security Numbers.
- Status management: `draft` → `processed` → `paid`.
- Digital Payslip Voucher generator with server-side ownership verification (employees can only access their own vouchers).

### G. Attendance Tracking
- Real-time clock-in and clock-out timestamps.
- Automated workday classification (`present`, `late`, `absent`).
- Personal attendance history for staff and team summaries for managers.

### H. Structured Immutable Audit Trail
- Automated logging of every security-relevant event:
  - Authentication success and failures
  - Account lockouts and unlocks
  - Sensitive profile and salary views
  - CRUD operations on employee and department collections
- Records capture actor user ID, email, action type, resource, IP address, user agent, execution status (`SUCCESS`, `FAILURE`, `DENIED`), and sanitized metadata.

---

## 4. Type of Data Handled

The system classifies and treats information into two distinct security tiers:

### 4.1 Sensitive Data (Confidential & Protected)
Information that presents legal, regulatory, or severe privacy impact if disclosed:
- **User Passwords:** Never stored in plaintext; stored strictly as one-way salted bcrypt hashes.
- **Government Identifiers (SSN / Tax IDs):** Stored encrypted at rest using AES-256-GCM authenticated encryption.
- **Financial & Compensation Data:** Basic salaries, bonuses, deductions, and net pay figures (encrypted and access-controlled).
- **Session Tokens & Secrets:** JWT signing keys (`JWT_SECRET`), MongoDB credentials, and encryption master keys.
- **Personal Contact Details:** Home addresses, personal phone numbers, and emergency contacts.
- **Audit Logs:** Security event records containing internal actor IDs and IP addresses.

### 4.2 Non-Sensitive / Operational Data
Public or low-impact organizational data necessary for day-to-day workflow navigation:
- **Department Names & Descriptions:** (e.g., "Engineering", "Human Resources", "Finance").
- **Job Titles & Positions:** (e.g., "Senior Software Engineer", "HR Director").
- **Public Employee Business Directory:** Business email address and professional title.
- **Calendar & Leave Categories:** System leave policy types (Annual, Sick, Emergency).
- **Workday Dates:** Calendar dates associated with attendance check-ins.
- **System Metrics:** Public uptime and generic error responses.
