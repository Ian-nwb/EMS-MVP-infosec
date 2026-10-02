import React, { useState, useEffect } from "react";
import api from "../services/api";
import { ShieldAlert, RefreshCw, Filter, ChevronDown, ChevronRight, Activity, Globe } from "lucide-react";

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (actionFilter) params.action = actionFilter;
      const res = await api.get("/audit", { params });
      setLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, actionFilter]);

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <ShieldAlert size={28} color="#f43f5e" /> Security Audit Log Explorer
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Immutable, cryptographically verifiable log of all authentication events, PII decryptions, and RBAC actions.
          </p>
        </div>

        <button onClick={fetchLogs} className="btn btn-secondary" title="Refresh Audit Logs">
          <RefreshCw size={15} /> Refresh Stream
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Filter size={16} color="var(--text-subtle)" />
          <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-muted)" }}>Filters:</span>
        </div>

        <select
          className="form-select"
          style={{ width: "auto", minWidth: "180px", padding: "0.45rem 0.75rem", fontSize: "0.8rem" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILURE">FAILURE</option>
          <option value="DENIED">DENIED (RBAC)</option>
        </select>

        <select
          className="form-select"
          style={{ width: "auto", minWidth: "220px", padding: "0.45rem 0.75rem", fontSize: "0.8rem" }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
          <option value="AUTH_LOGIN_FAILED">AUTH_LOGIN_FAILED</option>
          <option value="AUTH_LOGIN_LOCKED_ATTEMPT">AUTH_LOGIN_LOCKED_ATTEMPT</option>
          <option value="RBAC_ACCESS_DENIED">RBAC_ACCESS_DENIED</option>
          <option value="SENSITIVE_SSN_REVEAL">SENSITIVE_SSN_REVEAL</option>
          <option value="EMPLOYEE_CREATE">EMPLOYEE_CREATE</option>
          <option value="PAYROLL_CREATE">PAYROLL_CREATE</option>
          <option value="LEAVE_REQUEST_SUBMITTED">LEAVE_REQUEST_SUBMITTED</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No audit records matched your filter criteria.
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: "30px" }}></th>
                <th>Timestamp (UTC)</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Actor Email</th>
                <th>Client IP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isExpanded = expandedLogId === log._id;
                return (
                  <React.Fragment key={log._id}>
                    <tr
                      onClick={() => toggleExpand(log._id)}
                      style={{ cursor: "pointer", background: isExpanded ? "rgba(255,255,255,0.03)" : undefined }}
                    >
                      <td style={{ color: "var(--text-subtle)", padding: "0.5rem" }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {new Date(log.createdAt).toISOString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <code style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8rem",
                          color: log.action.includes("DENIED") || log.action.includes("LOCKED")
                            ? "#f87171"
                            : log.action.includes("REVEAL")
                            ? "#fbbf24"
                            : "#38bdf8",
                        }}>
                          {log.action}
                        </code>
                      </td>
                      <td style={{ fontSize: "0.825rem" }}>{log.resource}</td>
                      <td style={{ fontSize: "0.825rem", color: "#e2e8f0" }}>
                        {log.user_email || log.details?.attemptedEmail || "Anonymous / System"}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-subtle)" }}>
                        {log.ip_address || "127.0.0.1"}
                      </td>
                      <td>
                        <span className={`badge badge-${log.status === "SUCCESS" ? "success" : log.status === "DENIED" ? "danger" : "warning"}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable JSON details row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="7" style={{ background: "rgba(10, 15, 29, 0.9)", padding: "1.25rem 2rem" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 600, marginBottom: "0.4rem" }}>
                            Audit Payload Metadata & Telemetry
                          </div>
                          <pre style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.78rem",
                            color: "#94a3b8",
                            background: "rgba(0,0,0,0.5)",
                            padding: "0.85rem",
                            borderRadius: "6px",
                            overflowX: "auto",
                          }}>
                            {JSON.stringify(
                              {
                                auditId: log._id,
                                userAgent: log.user_agent,
                                resourceId: log.resource_id,
                                capturedDetails: log.details,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
