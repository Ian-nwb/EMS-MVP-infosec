# Live Demonstration Script & Presentation Guide (10–15 Minutes)

**Course Project:** Secure System Design, Risk Assessment, and Secure Implementation  
**Application:** NEVERIO Employee Management System (EMS)  
**Deliverable:** Rubric Part 6 — Presentation & System Demonstration  

---

## 0. Demo Credentials Reference

The application contains seeded demo personas with pre-configured roles and mock data:

| Persona | Role | Email | Password | Primary Demo Features |
|---|---|---|---|---|
| **Eleanor Vance** | **HR Admin** | `hr@ems.secure` | `Admin123!@#` | Full CRUD, SSN Decryption, Payroll Generation, Audit Logs Explorer |
| **Marcus Sterling** | **Manager** | `manager@ems.secure` | `Manager123!@#` | Department Team View, Leave Request Approvals, Attendance Review |
| **Sarah Chen** | **Employee** | `employee@ems.secure` | `Employee123!@#` | Self Profile, Leave Submission, Payslip Breakdown, Daily Punch Clock |

> **Pro-Tip:** Use the **Quick Switcher pill** (`HR` | `Mgr` | `Emp`) in the navigation bar to switch between user sessions instantly during the presentation.

---

## 1. Demo Walkthrough Agenda (12 Minutes Total)

### Act I: System Introduction & Security Architecture (2 Mins)
1. **Show the Login Screen:**
   - Point out the InfoSec Telemetry Banner: TLS 1.3, AES-256-GCM At-Rest, NoSQL Injection Shield, RBAC, Account Lockout.
   - Click **"View Security Architecture"** dropdown to explain cryptographic choices (Bcrypt cost 12, authenticated AES-256-GCM cipher with isolated IVs).

### Act II: HR Administrator Persona (4 Mins)
1. Click **`HR`** in the Quick Switcher (logs in as Eleanor Vance).
2. **Dashboard Overview:** Highlight live metrics (Employees, Departments, Leaves, Payrolls).
3. **Employees Tab:**
   - Demonstrate the employee directory with department filters.
   - **Show Encrypted SSN:** Point out masked SSNs (`***-**-2109`).
   - Click the eye icon next to Sarah Chen's SSN.
   - **Show the PII Decryption & Access Warning Modal:** Explain that decrypting sensitive government IDs is high-risk and will be audited.
   - Click **"Acknowledge & Reveal"** &rarr; SSN unmasks to `765-43-2109` in green.
4. **Departments Tab:** Show active departments and staff counts. Add or edit a department.
5. **Payroll Tab:**
   - Click **"Generate Payroll"**. Select an employee, enter bonus allowance or deduction.
   - Note real-time client-side and server-side net pay calculation.
   - Click **"Voucher"** on any payslip to open the official, printable itemized payslip voucher.
6. **Audit Logs Explorer (HR exclusive):**
   - Click the **"Audit Logs"** tab in the navbar.
   - Point out the recent `SENSITIVE_SSN_REVEAL` event captured with client IP, timestamp, and target employee name!
   - Expand the JSON payload to demonstrate complete forensic traceability.

### Act III: Manager Persona (2.5 Mins)
1. Click **`Mgr`** in the Quick Switcher (logs in as Marcus Sterling).
2. Point out that the navigation bar automatically hides the **Audit Logs** tab (Least Privilege principle).
3. **Leave Requests Tab:**
   - Find Sarah Chen's pending annual leave request.
   - Click **"Approve"** (or **"Reject"**), type manager feedback (e.g. *"Approved, coverage confirmed"*), and submit.
   - The status updates to Approved with the reviewer email recorded.

### Act IV: Employee Persona (2 Mins)
1. Click **`Emp`** in the Quick Switcher (logs in as Sarah Chen).
2. **Attendance Tab:**
   - View live digital clock. Enter check-in note (e.g. *"Remote security review"*).
   - Click **"Clock In"** &rarr; Attendance row created with timestamp and status (`present` / `late`).
3. **Leave Tab:** Submit a new leave request (e.g. Vacation for next month).
4. **Payroll Tab:**
   - Observe that Sarah **only** sees her own payslips (horizontal isolation).
   - Open her payslip voucher to review net compensation and deductions.

### Act V: Live Threat & Security Demonstration (2.5 Mins)
1. **Account Lockout Demonstration:**
   - Log out to return to login screen.
   - Enter `hr@ems.secure` with an intentional wrong password (`WrongPassword123!`).
   - Click submit 5 consecutive times.
   - Observe the live lockout message: *"Account locked due to 5 consecutive failed login attempts. Try again in 15 minutes."*
   - Even entering the correct password is now blocked with HTTP 403 Forbidden!
2. **Automated Test Suite Verification:**
   - Show the terminal and run `npm test` in `server/`.
   - All 4 test suites pass (13/13 tests green): Auth & Lockout, RBAC access denials, NoSQL operator injection fuzzing (`$ne` / `$gt`), and Payroll ownership isolation.

---

## 2. Q&A Speaking Points

- **Q: Where is the database connection string stored?**  
  *A: Stored strictly in `server/.env` (gitignored). `server/.env.example` provides safe templates for contributors.*
- **Q: How does the system defend against NoSQL injection?**  
  *A: Defense-in-depth: (1) Recursive key stripping middleware eliminates `$` and `.` operators, (2) Zod enforces scalar strings on inputs, (3) Mongoose strictly types schemas rejecting operator objects.*
- **Q: What happens if an employee tries to access an HR URL directly?**  
  *A: Backend RBAC middleware rejects the request with HTTP 403 Forbidden and writes an immutable `RBAC_ACCESS_DENIED` entry to the Audit Log.*
