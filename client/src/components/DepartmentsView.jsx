import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Building2, Plus, Edit2, Trash2, Users, X } from "lucide-react";

export default function DepartmentsView({ user }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const role = user?.role || "employee";
  const isHR = role === "hr";

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/departments");
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreate = () => {
    setIsEditing(false);
    setName("");
    setDescription("");
    setIsModalOpen(true);
  };

  const openEdit = (dept) => {
    setIsEditing(true);
    setSelectedDept(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/departments/${selectedDept._id}`, { name, description });
      } else {
        await api.post("/departments", { name, description });
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save department");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete department");
    }
  };

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Building2 size={28} color="#22d3ee" /> Departments
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Organizational structure, business units, and assigned staffing.
          </p>
        </div>

        {isHR && (
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> New Department
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          Loading departments...
        </div>
      ) : departments.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          No departments configured yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {departments.map((dept) => (
            <div key={dept._id} className="glass-panel" style={{ padding: "1.75rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                  {dept.name}
                </h3>
                <span className="badge badge-manager" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Users size={12} /> {dept.employeeCount || 0} Staff
                </span>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", minHeight: "2.8rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                {dept.description || "No description provided."}
              </p>

              {isHR && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
                  <button onClick={() => openEdit(dept)} className="btn btn-secondary btn-sm">
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(dept._id)} className="btn btn-danger btn-sm">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", color: "#fff" }}>
                {isEditing ? "Edit Department" : "Create New Department"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cybersecurity & Assurance"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of department responsibilities..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
