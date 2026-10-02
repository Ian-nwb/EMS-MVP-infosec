import React from "react";
import { ShieldCheck } from "lucide-react";

export default function SecurityBanner() {
  return (
    <div style={{
      background: "linear-gradient(90deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)",
      borderBottom: "1px solid var(--border-subtle)",
      padding: "0.45rem 1.5rem",
      fontSize: "0.78rem",
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        color: "var(--text-subtle)",
      }}>
        <div className="pulse-indicator" />
        <ShieldCheck size={13} style={{ color: "#34d399", flexShrink: 0 }} />
        <span style={{ color: "#e2e8f0", fontWeight: 500 }}>Security Active</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>Defense-in-Depth Enforced</span>
      </div>
    </div>
  );
}
