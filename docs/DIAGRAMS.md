# EMS — System Architecture & Data Flow Diagrams

Course Project: **Secure System Design, Risk Assessment, and Secure Implementation**  
Target Stack: **MERN (MongoDB Atlas · Express.js · React SPA · Node.js)**  

> **How to use these diagrams:**
> - **In VS Code / Antigravity:** Use any Markdown Preview with Mermaid support.
> - **In Web / Live Preview:** Copy any Mermaid block below and paste into [mermaid.live](https://mermaid.live) or [gitdiagram.com](https://gitdiagram.com).
> - **In Draw.io:** Open [`docs/architecture_and_dfd.drawio`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/docs/architecture_and_dfd.drawio) directly in [app.diagrams.net](https://app.diagrams.net).
> - **In Browser:** Double-click [`docs/view_diagrams.html`](file:///home/ian/Desktop/Work/INFOSEC-NEVERIO/docs/view_diagrams.html) to view visual rendered diagrams offline.

---

## 1. System Architecture Diagram (Mermaid)

```mermaid
flowchart TD
  %% Client Subgraph
  subgraph Client["Client Tier (User Interface)"]
    UI["React SPA (Vite)
    • Modern Cyber Theme
    • Superadmin / HR / Manager / Employee Views"]
    AXIOS["Axios HTTP Client
    • Auto Bearer Token Injection
    • 401 Interceptor & Logout"]
    UI --> AXIOS
  end

  %% HTTPS Gateway
  subgraph Gateway["HTTPS / TLS 1.3 Communication Channel"]
    MW["Express.js Application Gateway (Port 5000)"]
    
    subgraph Security["Defense-in-Depth Security Layer"]
      HELMET["1. Helmet Security Headers
      (CSP, HSTS, X-Frame-Options, Sniff Protection)"]
      RATE["2. Rate Limiting Middleware
      (authLimiter: 300 req/15m · apiLimiter: 200 req/15m)"]
      CORS["3. Strict CORS Origin Allow-list"]
      SAN["4. express-mongo-sanitize
      (Strips '$' and '.' NoSQL Injection keys)"]
      AUTH["5. JWT Authentication Guard
      (Verifies Bearer token signature & 4h expiry)"]
      LOCK["6. Account Lockout Enforcer
      (Blocks after 5 consecutive failed attempts)"]
      RBAC["7. RBAC Role-Based Access Control
      (superadmin / hr / manager / employee)"]
      VAL["8. Zod Schema Validation
      (Strict input type and allow-list checking)"]
    end

    subgraph Business["Business Logic & Domain Services"]
      CTRL["EMS Controllers
      • Superadmin CRUD (Users)
      • Employee & Department
      • Leave Approval Engine
      • Attendance & Payroll"]
      CRYPTO["Node.js Crypto Engine
      (AES-256-GCM Field Encryption at Rest)"]
      LOG["Structured Audit Logger
      (Tamper-evident security trail)"]
    end
  end

  %% Data Tier
  subgraph Data["Data Tier (Persistent Storage)"]
    MONGOOSE["Typed Mongoose ODM Schemas"]
    DB[("MongoDB Atlas Cloud
    Cluster: sandbox.rj1ahhe.mongodb.net
    Database: torinvr_db")]
  end

  %% Connections
  AXIOS -->|"HTTPS / Bearer <JWT>"| MW
  MW --> HELMET
  HELMET --> RATE --> CORS --> SAN --> AUTH --> LOCK --> RBAC --> VAL --> CTRL
  CTRL --> CRYPTO --> MONGOOSE --> DB
  CTRL --> LOG --> MONGOOSE
```

---

## 2. Data Flow Diagram (DFD) — Authentication & Query Execution

```mermaid
flowchart LR
  %% Stages
  REQ["1. User Login Request
  (email, password)"]
  
  SAN_VAL["2. Sanitize & Validate
  (strip '$' / '.', Zod check)"]
  
  LOCK_CHK{"3. Account
  Locked?"}
  
  LOCK_OUT["403 Forbidden
  (Locked for 15 min)"]
  
  HASH_CHK{"4. bcrypt Hash
  Compare"}
  
  FAIL_LOG["Fail Counter +1
  Write Audit Log
  401 Unauthorized"]
  
  JWT_GEN["5. Issue Short-Lived JWT
  (Signed, 4-Hour Lifetime)"]
  
  RBAC_CHK{"6. RBAC Policy
  Check"}
  
  DENIED["403 Forbidden
  + Denied Audit Event"]
  
  QUERY["7. Typed Mongoose Query
  (Strict Type Safety)"]
  
  ENC["8. AES-256-GCM
  Field Encryption at Rest"]
  
  RESP["9. Sanitized Response
  over TLS 1.3"]

  %% Flow lines
  REQ --> SAN_VAL
  SAN_VAL --> LOCK_CHK
  LOCK_CHK -->|"Yes (Active)"| LOCK_OUT
  LOCK_CHK -->|"No"| HASH_CHK
  HASH_CHK -->|"Mismatch"| FAIL_LOG
  HASH_CHK -->|"Match (Success)"| JWT_GEN
  JWT_GEN --> RBAC_CHK
  RBAC_CHK -->|"Role Denied"| DENIED
  RBAC_CHK -->|"Role Allowed"| QUERY
  QUERY --> ENC
  ENC --> RESP
```

---

## 3. Database Entity-Relationship (ER) Diagram

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
    string role "superadmin | hr | manager | employee"
    number failedLoginAttempts
    date lockoutUntil
    boolean isActive
  }

  EMPLOYEES {
    ObjectId _id PK
    ObjectId user_id FK
    string full_name
    string position
    ObjectId department_id FK
    string ssn_encrypted "AES-256-GCM"
    number salary "Validated number"
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
    string status "pending | approved | rejected"
    ObjectId reviewed_by FK
  }

  PAYROLL {
    ObjectId _id PK
    ObjectId employee_id FK
    number basic_salary
    number allowances
    number deductions
    number net_pay "Server calculated"
    date pay_date
    string status "draft | processed | paid"
  }

  ATTENDANCE {
    ObjectId _id PK
    ObjectId employee_id FK
    date date
    datetime check_in
    datetime check_out
    string status "present | late | absent"
  }

  AUDIT_LOGS {
    ObjectId _id PK
    ObjectId user_id FK
    string action "IMMUTABLE"
    string resource
    string status "SUCCESS | FAILURE | DENIED"
    string ip_address
    datetime createdAt
  }
```
