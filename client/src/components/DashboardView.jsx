import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Users, Building2, CalendarClock, CreditCard, ShieldCheck, ArrowRight, UserPlus, Clock } from "lucide-react";

export default function DashboardView({ user, onNavigate }) {
  const [stats, setStats] = useState({
    employees: 0,
    departments: 0,
    leaves: 0,
    payroll: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [empRes, deptRes, leaveRes, payRes] = await Promise.allSettled([
          api.get("/employees"),
          api.get("/departments"),
          api.get("/leave"),
          api.get("/payroll"),
        ]);

        setStats({
          employees: empRes.status === "fulfilled" ? empRes.value.data.count || 0 : 0,
          departments: deptRes.status === "fulfilled" ? deptRes.value.data.count || 0 : 0,
          leaves: leaveRes.status === "fulfilled" ? leaveRes.value.data.count || 0 : 0,
          payroll: payRes.status === "fulfilled" ? payRes.value.data.count || 0 : 0,
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  const role = user?.role || "employee";

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: "2rem",
        borderRadius: "var(--radius-lg)",
        marginBottom: "2rem",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span className={`badge badge-${role}`}>{role} portal</span>
            <span style={{ color: "var(--text-subtle)", fontSize: "0.8rem" }}>Session Secured</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff" }}>
            Welcome back, {user?.employee?.full_name || user?.email}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.3rem" }}>
            {role === "hr" && "Full administrative control over personnel records, payroll distribution, and system audit logs."}
            {role === "manager" && "Team supervision, departmental leave review, and attendance oversight."}
            {role === "employee" && "View your personal employment profile, file leave requests, and inspect recent payslips."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {role === "hr" && (
            <button onClick={() => onNavigate("employees")} className="btn btn-primary">
              <UserPlus size={16} /> Manage Employees
            </button>
          )}
          <button onClick={() => onNavigate("attendance")} className="btn btn-secondary">
            <Clock size={16} /> Punch Clock / Log
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2.5rem",
      }}>
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.825rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              {role === "employee" ? "Your Profile" : "Total Employees"}
            </span>
            <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
              <Users size={20} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>
            {loading ? "..." : stats.employees}
          </div>
          <button
            onClick={() => onNavigate("employees")}
            style={{
              background: "none",
              border: "none",
              color: "#818cf8",
              fontSize: "0.8rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              cursor: "pointer",
              marginTop: "0.75rem",
            }}
          >
            {role === "employee" ? "View My Details" : "View Directory"} <ArrowRight size={14} />
          </button>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.825rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Departments
            </span>
            <div style={{ background: "rgba(6, 182, 212, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
              <Building2 size={20} color="#22d3ee" />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>
            {loading ? "..." : stats.departments}
          </div>
          <button
            onClick={() => onNavigate("departments")}
            style={{
              background: "none",
              border: "none",
              color: "#22d3ee",
              fontSize: "0.8rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              cursor: "pointer",
              marginTop: "0.75rem",
            }}
          >
            Explore Departments <ArrowRight size={14} />
          </button>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.825rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Leave Requests
            </span>
            <div style={{ background: "rgba(245, 158, 11, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
              <CalendarClock size={20} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>
            {loading ? "..." : stats.leaves}
          </div>
          <button
            onClick={() => onNavigate("leaves")}
            style={{
              background: "none",
              border: "none",
              color: "#fbbf24",
              fontSize: "0.8rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              cursor: "pointer",
              marginTop: "0.75rem",
            }}
          >
            {role === "employee" ? "Submit / Track Leave" : "Review Requests"} <ArrowRight size={14} />
          </button>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.825rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Payroll Records
            </span>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
              <CreditCard size={20} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>
            {loading ? "..." : stats.payroll}
          </div>
          <button
            onClick={() => onNavigate("payroll")}
            style={{
              background: "none",
              border: "none",
              color: "#34d399",
              fontSize: "0.8rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              cursor: "pointer",
              marginTop: "0.75rem",
            }}
          >
            {role === "employee" ? "View My Payslips" : "Manage Payroll"} <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Security Health & Controls Checklist */}
      <div className="glass-panel" style={{ padding: "1.75rem", borderRadius: "var(--radius-md)" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={20} color="#34d399" /> System Security Posture & Verified Controls
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontWeight: 600, color: "#93c5fd", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
              1. Sensitive PII At-Rest Encryption
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Employee SSNs and Government IDs are encrypted with AES-256-GCM. Unmasked display requires explicit HR request and generates immediate audit record.
            </p>
          </div>
          <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontWeight: 600, color: "#86efac", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
              2. NoSQL Operator Protection
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Recursive key stripping removes <code>$ne</code>, <code>$gt</code>, and dot notation injections. Mongoose strictly enforces types for numeric salaries.
            </p>
          </div>
          <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontWeight: 600, color: "#fca5a5", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
              3. Rate Limiting & Account Lockout
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Accounts automatically enter a 15-minute lockout period upon 5 consecutive failed login attempts to neutralize online credential stuffing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
