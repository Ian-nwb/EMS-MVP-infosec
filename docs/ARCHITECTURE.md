# System Architecture & Data Flow Diagrams

Course Project: Secure System Design, Risk Assessment, and Secure Implementation  
Target Stack: MERN (MongoDB Atlas · Express.js · React · Node.js)

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
  subgraph Client["Frontend Client (React SPA - Vite)"]
    UI["Modern Cyber UI / Dashboard"]
    AXIOS["Axios HTTP Client + Auth Interceptor"]
  end

  subgraph Gateway["Secure Gateway (Express.js / TLS 1.3)"]
    HELMET["Helmet Security Headers (CSP, HSTS, X-Content-Type)"]
    RATE["Rate Limiter (Gateway & Auth brute-force mitigation)"]
    CORS["CORS Policy Enforcement (Strict Origin Allow-List)"]
    PAYLOAD["Body Parser with 15KB Limit (DoS mitigation)"]
    SAN["NoSQL Injection Sanitizer (Strips '$' and '.' keys)"]
    AUTH["JWT Authentication Middleware (Bearer Token Verification)"]
    RBAC["RBAC Policy Guard (HR / Manager / Employee)"]
    VAL["Zod Input Schema Validation"]
    BIZ["Business Logic & Domain Controllers"]
    LOG["Structured Audit Logger (Immutable Records)"]
  end

  subgraph DataTier["Data Tier"]
    CRYPTO["Node.js Crypto (AES-256-GCM Field Encryption)"]
    MONGOOSE["Typed Mongoose ODM"]
    DB[("MongoDB Atlas (torinvr_db) / Resilient Local Replica")]
  end

  UI --> AXIOS
  AXIOS -->|HTTPS / Bearer Token| HELMET
  HELMET --> RATE --> CORS --> PAYLOAD --> SAN --> AUTH --> RBAC --> VAL --> BIZ
  BIZ --> CRYPTO
  CRYPTO --> MONGOOSE
  BIZ --> LOG
  MONGOOSE --> DB
  LOG --> DB
```

---

## 2. Authentication & Data Flow (Defense-in-Depth)

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant API as Express API & Middleware
    participant Val as Zod Validator
    participant Auth as Auth & Lockout Guard
    participant DB as MongoDB Atlas

    User->>API: POST /api/auth/login (email, password)
    API->>API: Sanitize keys (strip $, .)
    API->>Val: Validate against loginSchema
    alt Schema Invalid
        Val-->>User: 400 Bad Request (Validation Error)
    end
    API->>Auth: Query User by typed email
    Auth->>DB: findOne({ email })
    DB-->>Auth: User record (with lockout status)
    alt Account is Locked
        Auth-->>User: 403 Forbidden (Lockout Active for 15 min)
    end
    Auth->>Auth: bcrypt.compare(candidate, hash)
    alt Password Mismatch
        Auth->>DB: incrementFailedLogins()
        Auth->>DB: writeAuditLog("AUTH_LOGIN_FAILED")
        Auth-->>User: 401 Unauthorized (Remaining attempts warning)
    end
    Auth->>DB: resetFailedLogins()
    Auth->>Auth: Issue short-lived JWT (4 hours)
    Auth->>DB: writeAuditLog("AUTH_LOGIN_SUCCESS")
    Auth-->>User: 200 OK (JWT token + profile)
```

---

## 3. Entity-Relationship Data Model

```mermaid
erDiagram
  USERS ||--o| EMPLOYEES : "links to"
  EMPLOYEES }o--|| DEPARTMENTS : "belongs to"
  EMPLOYEES ||--o{ LEAVE_REQUESTS : "submits"
  EMPLOYEES ||--o{ PAYROLL : "receives"
  EMPLOYEES ||--o{ ATTENDANCE : "records"
  USERS ||--o{ AUDIT_LOGS : "triggers"

  USERS {
    ObjectId _id PK
    string email UK
    string password_hash "Bcrypt cost 12"
    string role "hr | manager | employee"
    number failedLoginAttempts
    date lockoutUntil
    boolean isActive
  }

  EMPLOYEES {
    ObjectId _id PK
    ObjectId user_id FK "nullable"
    string full_name
    string position
    ObjectId department_id FK
    string ssn_encrypted "AES-256-GCM cipher hex"
    number salary "Strict numeric validation"
    string contact_number
    string employment_status
  }

  DEPARTMENTS {
    ObjectId _id PK
    string name UK
    string description
    ObjectId manager_id FK
  }

  LEAVE_REQUESTS {
    ObjectId _id PK
    ObjectId employee_id FK
    string leave_type
    date start_date
    date end_date
    string reason
    string status "pending | approved | rejected"
    ObjectId reviewed_by FK
    string reviewer_notes
  }

  PAYROLL {
    ObjectId _id PK
    ObjectId employee_id FK
    number basic_salary
    number allowances
    number deductions
    number net_pay "Calculated server-side"
    string pay_period
    date pay_date
    string status "draft | processed | paid"
  }

  ATTENDANCE {
    ObjectId _id PK
    ObjectId employee_id FK
    date date
    date check_in
    date check_out
    string status "present | late | absent"
    string notes
  }

  AUDIT_LOGS {
    ObjectId _id PK
    ObjectId user_id FK
    string user_email
    string action "IMMUTABLE"
    string resource
    string resource_id
    string status "SUCCESS | FAILURE | DENIED"
    string ip_address
    string user_agent
    object details "Sanitized metadata"
    date createdAt "Indexed"
  }
```
