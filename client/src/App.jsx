import React, { useState, useEffect } from "react";
import api from "./services/api";
import Navbar from "./components/Navbar";
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import EmployeesView from "./components/EmployeesView";
import DepartmentsView from "./components/DepartmentsView";
import LeaveView from "./components/LeaveView";
import PayrollView from "./components/PayrollView";
import AttendanceView from "./components/AttendanceView";
import AuditLogsView from "./components/AuditLogsView";
import SuperAdminView from "./components/SuperAdminView";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [initialLoading, setInitialLoading] = useState(true);

  // Check existing session
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("ems_token");
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data.user);
          if (res.data.user?.role === "superadmin") {
            setActiveTab("users");
          }
        } catch (err) {
          localStorage.removeItem("ems_token");
          localStorage.removeItem("ems_user");
          setUser(null);
        }
      }
      setInitialLoading(false);
    }

    checkAuth();

    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab(userData?.role === "superadmin" ? "users" : "dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("ems_token");
    localStorage.removeItem("ems_user");
    setUser(null);
  };

  if (initialLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: "0.95rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="pulse-indicator" style={{ width: "16px", height: "16px", marginBottom: "1rem" }} />
          <div>Loading EMS...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, paddingBottom: "3rem" }}>
        {user.role === "superadmin" ? (
          <SuperAdminView currentUser={user} />
        ) : (
          <>
            {activeTab === "dashboard" && (
              <DashboardView user={user} onNavigate={(tab) => setActiveTab(tab)} />
            )}
            {activeTab === "employees" && <EmployeesView user={user} />}
            {activeTab === "departments" && <DepartmentsView user={user} />}
            {activeTab === "leaves" && <LeaveView user={user} />}
            {activeTab === "payroll" && <PayrollView user={user} />}
            {activeTab === "attendance" && <AttendanceView user={user} />}
            {activeTab === "audit" && user.role === "hr" && <AuditLogsView />}
          </>
        )}
      </main>

      {/* Clean Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "rgba(10, 15, 29, 0.8)",
        padding: "1.25rem 2rem",
        textAlign: "center",
        fontSize: "0.825rem",
        color: "var(--text-subtle)",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            EMS &bull; Employee Management System
          </div>
          <div>
            &copy; {new Date().getFullYear()} All Rights Reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
