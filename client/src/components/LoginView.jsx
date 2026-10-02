import React, { useState } from "react";
import api from "../services/api";
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post("/auth/register", { email, password });
        localStorage.setItem("ems_token", res.data.token);
        localStorage.setItem("ems_user", JSON.stringify(res.data.user));
        setSuccessMsg("Account registered successfully! Redirecting...");
        setTimeout(() => onLoginSuccess(res.data.user), 400);
      } else {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem("ems_token", res.data.token);
        localStorage.setItem("ems_user", JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "460px",
        padding: "2.5rem 2rem",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.7), 0 0 30px -5px rgba(99,102,241,0.2)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            marginBottom: "1rem",
          }}>
            <Shield size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            <span style={{ color: "#38bdf8" }}>EMS</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
            Employee Management System
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--danger-bg)",
            color: "#fca5a5",
            padding: "0.75rem 0.9rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.825rem",
            marginBottom: "1.25rem",
            border: "1px solid rgba(244, 63, 94, 0.3)",
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--success-bg)",
            color: "#86efac",
            padding: "0.75rem 0.9rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.825rem",
            marginBottom: "1.25rem",
            border: "1px solid rgba(16, 185, 129, 0.3)",
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
            {isRegister && (
              <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)", marginTop: "0.2rem" }}>
                Min 8 chars, 1 uppercase, 1 lowercase, 1 number & 1 symbol.
              </span>
            )}
          </div>

          {isRegister && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-subtle)", margin: "0.25rem 0 0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              New accounts are created as <strong style={{ color: "#818cf8" }}>Employee</strong>. An HR admin can update your role.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem", fontSize: "0.95rem" }}
          >
            {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-cyan)",
              fontSize: "0.825rem",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isRegister ? "Already registered? Sign in" : "Need a new account? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}
