# NEVERIO — Secure Employee Management System (EMS)

[![Security: Defense-in-Depth](https://img.shields.io/badge/Security-Defense--in--Depth-blue?style=for-the-badge&logo=shield)](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/docs/ARCHITECTURE.md)
[![Tests: 13 Passed](https://img.shields.io/badge/Tests-13%20Passing-brightgreen?style=for-the-badge&logo=jest)](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/server/tests)
[![Stack: MERN](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-success?style=for-the-badge)](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/AGENTS.md)

**Course Project:** Secure System Design, Risk Assessment, and Secure Implementation  
**Target Stack:** MERN — MongoDB Atlas (`torinvr_db`) · Express.js · React (Vite) · Node.js  

---

## 🌟 Executive Overview

NEVERIO EMS is a defense-in-depth, role-based Employee Management System engineered with military-grade application security controls, cryptographic data isolation, threat modeling mitigations, and comprehensive audit observability.

### Key Architectural Highlights
- 🛡️ **Defense-in-Depth Architecture:** Gateway rate limiting &rarr; Security headers (Helmet) &rarr; NoSQL injection operator sanitization &rarr; Strict Zod schema validation &rarr; JWT authentication &rarr; RBAC guards &rarr; AES-256-GCM field encryption &rarr; Immutable audit logging.
- 🔐 **Cryptographic At-Rest Isolation:** Sensitive PII (Social Security Numbers, Government IDs) are encrypted with AES-256-GCM ciphers with unique initialization vectors (IV) before database persistence.
- 🚫 **Account Lockout & Brute-Force Shield:** Automatic 15-minute account lockout triggered after 5 consecutive failed login attempts, coupled with IP-based rate limiting.
- 🔍 **Strict Horizontal Isolation:** Strict server-side ownership checks ensure employees cannot access peers' payslips or personal records.
- 📋 **Immutable Audit Trail:** High-resolution security event capture of login attempts, privilege access denials, and audited PII decryptions with client IP and user-agent metadata.

---

## 🏗️ Repository Architecture

```text
INFOSEC-NEVERIO/
├── client/                     # Frontend Single Page App (React + Vite)
│   ├── src/
│   │   ├── components/         # Modular UI views (Employees, Leaves, Payroll, etc.)
│   │   ├── services/api.js     # Axios client with JWT interceptor
│   │   ├── App.jsx             # Main Application & role router
│   │   └── index.css           # Modern Cyber Glassmorphism Design System
│   └── package.json
├── server/                     # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/        # Domain controllers (Auth, Employee, Payroll, etc.)
│   │   ├── models/             # Mongoose schemas (User, Employee, AuditLog, etc.)
│   │   ├── middleware/         # Auth, RBAC, Zod validation, RateLimit, Sanitize
│   │   ├── utils/              # AES-256 crypto helpers, Logger, DB Seed
│   │   ├── routes/             # RESTful API route definitions
│   │   ├── app.js              # Express app & security pipeline
│   │   ├── db.js               # Resilient MongoDB Atlas / local connector
│   │   └── server.js           # Server bootstrap
│   ├── tests/                  # Jest & Supertest automated test suites
│   ├── .env                    # Secrets & configuration (gitignored)
│   └── .env.example            # Committed template without secrets
├── docs/                       # Complete Academic & Rubric Documentation
│   ├── ARCHITECTURE.md         # Mermaid system architecture and data flow diagrams
│   ├── RISK_REPORT.md          # Rubric Part 2: Asset, Threat & Risk Matrix (25%)
│   ├── CODE_REVIEW.md          # Rubric Part 5: Code review findings & STRIDE model (15%)
│   └── DEMO_SCRIPT.md          # Rubric Part 6: Step-by-step 10–15 min presentation guide
├── AGENTS.md                   # Source-of-truth implementation plan & grading rubric
├── .gitignore                  # Git ignore rules protecting .env and node_modules
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v20+` or `v24+`
- MongoDB Atlas account (or local MongoDB daemon)

### 1. Server Configuration
The environment variables are stored in `server/.env`. A safe template is committed in `server/.env.example`.

```bash
# server/.env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://torinvr_db_user:<password>@tori.h1nyjfo.mongodb.net/torinvr_db?retryWrites=true&w=majority
JWT_SECRET=ems_super_secure_jwt_token_secret_key_38472918471928472918
CLIENT_URL=http://localhost:5173
```

### 2. Start the Backend Server
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:5000
```
*Note: The server automatically connects to MongoDB and seeds baseline demo accounts on initial startup.*

### 3. Start the Frontend Client
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 👥 Seeded Demo Accounts

You can log in directly or use the **Quick Persona Switcher** in the top navigation bar:

| Role | Email | Password | Scope of Access |
|---|---|---|---|
| **HR Administrator** | `hr@ems.secure` | `Admin123!@#` | Full CRUD on employees, departments, payroll, and view audit stream. |
| **Manager** | `manager@ems.secure` | `Manager123!@#` | Team view, approve/reject departmental leaves, inspect attendance. |
| **Employee** | `employee@ems.secure` | `Employee123!@#` | Self profile, leave requests, attendance punch clock, and own payslips. |

---

## 🧪 Running Security Test Suites

The project includes unit and integration tests covering authentication, brute-force lockout, RBAC authorization, NoSQL operator injection fuzzing, and payroll horizontal isolation:

```bash
cd server
npm test
```

### Test Coverage Highlights:
- ✅ **Authentication:** Bcrypt complexity enforcement, JWT issuance, and 5-attempt account lockout.
- ✅ **RBAC Guards:** Verifies 403 Forbidden enforcement and audit log emission when regular users attempt administrative actions.
- ✅ **NoSQL Injection Mitigation:** Fuzzing with nested `$ne` and `$gt` query objects confirms sanitization and Zod type rejections.
- ✅ **Confidentiality Access Control:** Validates that employees cannot read peer payslip records.

---

## 📚 Course Project Documentation

- [System Architecture & Mermaid Diagrams](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/docs/ARCHITECTURE.md)
- [Risk Management & Threat Assessment Report (Part 2 - 25%)](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/docs/RISK_REPORT.md)
- [Code Review Findings & STRIDE-Lite Threat Model (Part 5 - 15%)](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/docs/CODE_REVIEW.md)
- [Live Demonstration Script & Presentation Guide (Part 6 - 15%)](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/docs/DEMO_SCRIPT.md)
