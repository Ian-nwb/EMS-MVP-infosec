import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import {
  Users, Plus, Trash2, RefreshCw, Pencil, ShieldCheck,
  X, Check, UnlockKeyhole, AlertCircle, ChevronDown,
} from "lucide-react";

const ROLES = ["employee", "manager", "hr", "superadmin"];
const ROLE_COLORS = {
  superadmin: "#f472b6",
  hr: "#c084fc",
  manager: "#38bdf8",
  employee: "#818cf8",
};

const pill = (role) => ({
  display: "inline-block",
  padding: "0.15rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.7rem",
  fontWeight: 700,
  background: `${ROLE_COLORS[role] || "#64748b"}22`,
  color: ROLE_COLORS[role] || "#94a3b8",
  border: `1px solid ${ROLE_COLORS[role] || "#64748b"}55`,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

const EMPTY_FORM = { email: "", password: "", role: "employee" };

export default function SuperAdminView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/superadmin/users");
      setUsers(res.data.users);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create User ────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/superadmin/users", form);
      flash("User created successfully.");
      setForm(EMPTY_FORM);
      setShowCreate(false);
      load();
    } catch (e) {
      flash(e.response?.data?.message || "Error creating user");
    } finally {
      setCreating(false);
    }
  };

  // ── Update Role ────────────────────────────────────────────────────────
  const handleUpdateRole = async (id) => {
    setSaving(true);
    try {
      await api.put(`/superadmin/users/${id}`, { role: editRole });
      flash("Role updated.");
      setEditId(null);
      load();
    } catch (e) {
      flash(e.response?.data?.message || "Error updating role");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Active ──────────────────────────────────────────────────────
  const handleToggleActive = async (user) => {
    try {
      await api.put(`/superadmin/users/${user._id}`, { isActive: !user.isActive });
      flash(`User ${user.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch (e) {
      flash(e.response?.data?.message || "Error toggling user");
    }
  };

  // ── Unlock ─────────────────────────────────────────────────────────────
  const handleUnlock = async (user) => {
    try {
      await api.post(`/superadmin/users/${user._id}/unlock`);
      flash(`${user.email} unlocked.`);
      load();
    } catch (e) {
      flash(e.response?.data?.message || "Error unlocking user");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/superadmin/users/${user._id}`);
      flash("User deleted.");
      load();
    } catch (e) {
      flash(e.response?.data?.message || "Error deleting user");
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: "linear-gradient(135deg, #f472b6 0%, #c084fc 100%)",
            width: "40px", height: "40px", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(244,114,182,0.4)",
          }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#fff" }}>User Management</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>Superadmin — Full CRUD Access</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button onClick={load} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => { setShowCreate(!showCreate); setForm(EMPTY_FORM); }} className="btn btn-primary btn-sm">
            {showCreate ? <X size={15} /> : <Plus size={15} />}
            {showCreate ? "Cancel" : "Add User"}
          </button>
        </div>
      </div>

      {/* Flash message */}
      {actionMsg && (
        <div style={{
          background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
          color: "#6ee7b7", borderRadius: "8px", padding: "0.65rem 1rem",
          marginBottom: "1rem", fontSize: "0.825rem", display: "flex", alignItems: "center", gap: "0.4rem",
        }}>
          <Check size={15} /> {actionMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "var(--danger-bg)", border: "1px solid rgba(244,63,94,0.3)",
          color: "#fca5a5", borderRadius: "8px", padding: "0.65rem 1rem",
          marginBottom: "1rem", fontSize: "0.825rem", display: "flex", alignItems: "center", gap: "0.4rem",
        }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1.5rem", borderRadius: "12px" }}>
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: "1rem", fontSize: "0.9rem" }}>New User</div>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "0.75rem", alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: "0.75rem" }}>Email</label>
              <input type="email" required className="form-input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@ems.com" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: "0.75rem" }}>Password</label>
              <input type="password" required className="form-input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 chars" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: "0.75rem" }}>Role</label>
              <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={creating} className="btn btn-primary btn-sm" style={{ height: "38px" }}>
              {creating ? "Creating..." : "Create"}
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel" style={{ borderRadius: "12px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-subtle)" }}>
            <div className="pulse-indicator" style={{ margin: "0 auto 0.75rem" }} />
            Loading users...
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Email", "Name", "Role", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "left", color: "var(--text-subtle)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isLocked = u.lockoutUntil && new Date(u.lockoutUntil) > new Date();
                const isSelf = u._id === currentUser?.id;
                return (
                  <tr key={u._id} style={{ borderBottom: "1px solid var(--border-subtle)", opacity: u.isActive ? 1 : 0.5 }}>
                    <td style={{ padding: "0.85rem 1rem", color: "#e2e8f0" }}>
                      {u.email}
                      {isSelf && <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", color: "#f472b6", fontWeight: 700 }}>(you)</span>}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>
                      {u.employee?.full_name || <span style={{ color: "var(--text-subtle)", fontStyle: "italic" }}>—</span>}
                    </td>

                    {/* Role cell — inline edit */}
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {editId === u._id ? (
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          <select className="form-select" value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", height: "30px" }}>
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button onClick={() => handleUpdateRole(u._id)} disabled={saving} className="btn btn-primary btn-sm" style={{ padding: "0.2rem 0.5rem", height: "30px" }}>
                            <Check size={13} />
                          </button>
                          <button onClick={() => setEditId(null)} className="btn btn-secondary btn-sm" style={{ padding: "0.2rem 0.5rem", height: "30px" }}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={pill(u.role)}>{u.role}</span>
                          {!isSelf && (
                            <button onClick={() => { setEditId(u._id); setEditRole(u.role); }}
                              className="btn btn-secondary btn-sm" style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem" }} title="Edit role">
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span style={{
                        ...pill(u.isActive ? "employee" : "manager"),
                        background: u.isActive ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                        color: u.isActive ? "#34d399" : "#f87171",
                        borderColor: u.isActive ? "#34d39955" : "#f8717155",
                      }}>
                        {isLocked ? "Locked" : u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {isLocked && (
                          <button onClick={() => handleUnlock(u)} className="btn btn-secondary btn-sm" title="Unlock account" style={{ padding: "0.3rem 0.5rem" }}>
                            <UnlockKeyhole size={14} style={{ color: "#fbbf24" }} />
                          </button>
                        )}
                        {!isSelf && (
                          <button onClick={() => handleToggleActive(u)} className="btn btn-secondary btn-sm"
                            title={u.isActive ? "Deactivate" : "Activate"} style={{ padding: "0.3rem 0.5rem" }}>
                            {u.isActive
                              ? <X size={14} style={{ color: "#f87171" }} />
                              : <Check size={14} style={{ color: "#34d399" }} />}
                          </button>
                        )}
                        {!isSelf && (
                          <button onClick={() => handleDelete(u)} className="btn btn-secondary btn-sm"
                            title="Delete user" style={{ padding: "0.3rem 0.5rem" }}>
                            <Trash2 size={14} style={{ color: "#f87171" }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "var(--text-subtle)" }}>
        {users.length} user{users.length !== 1 ? "s" : ""} total
      </div>
    </div>
  );
}
