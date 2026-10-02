import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Building2,
  CalendarCheck,
  CreditCard,
  Clock,
  ShieldAlert,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

export default function Navbar({ user, activeTab, setActiveTab, onLogout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const role = user?.role || "employee";

  const navItems =
    role === "superadmin"
      ? [{ id: "users", label: "User Management", icon: ShieldCheck, accent: "#f472b6" }]
      : [
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "employees", label: "Employees", icon: Users },
          { id: "departments", label: "Departments", icon: Building2 },
          { id: "leaves", label: "Leave Requests", icon: CalendarCheck },
          { id: "payroll", label: "Payroll", icon: CreditCard },
          { id: "attendance", label: "Attendance", icon: Clock },
          ...(role === "hr" ? [{ id: "audit", label: "Audit Logs", icon: ShieldAlert }] : []),
        ];

  return (
    <>
      <header style={{
      background: "rgba(17, 24, 39, 0.9)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border-subtle)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(99, 102, 241, 0.4)",
          }}>
            <Users size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em", color: "#fff" }}>
              EMS
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-subtle)", marginTop: "-3px" }}>
              Employee Management System
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "0.825rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#ffffff" : "var(--text-muted)",
                  background: isActive ? "rgba(99, 102, 241, 0.18)" : "transparent",
                  boxShadow: isActive ? "inset 0 0 0 1px rgba(99, 102, 241, 0.4)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={16} color={isActive ? (item.accent || "#818cf8") : "currentColor"} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Current Profile & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>
              {user?.employee?.full_name || user?.email?.split("@")[0]}
            </span>
            <span className={`badge badge-${role}`} style={{ alignSelf: "flex-end", fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
              {role}
            </span>
          </div>
          
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Log Out"
            className="btn btn-secondary btn-sm"
            style={{ padding: "0.45rem", borderRadius: "8px" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

    </header>

    {/* Logout Confirmation Modal Portal — Centered in Screen */}
    {showLogoutModal && typeof document !== "undefined" && createPortal(
      <div
        className="modal-overlay"
        onClick={() => setShowLogoutModal(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          padding: "1rem",
          margin: 0,
          boxSizing: "border-box",
        }}
      >
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "420px",
            width: "100%",
            padding: "2rem",
            textAlign: "center",
            margin: "auto",
            position: "relative",
            borderRadius: "16px",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              color: "#f87171",
            }}
          >
            <LogOut size={26} />
          </div>

          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
            Confirm Logout
          </h3>

          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.75rem" }}>
            Are you sure you want to end your session? You will need your credentials to sign back in.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowLogoutModal(false)}
              style={{ minWidth: "110px", padding: "0.6rem 1rem" }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                setShowLogoutModal(false);
                onLogout();
              }}
              style={{
                minWidth: "110px",
                padding: "0.6rem 1rem",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                fontWeight: 600,
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
}
