import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  Users,
  UserPlus,
  Search,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Lock,
  AlertTriangle,
  X,
  Check,
  ShieldAlert,
} from "lucide-react";

export default function EmployeesView({ user }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [revealModal, setRevealModal] = useState({ open: false, empId: null, empName: "" });
  const [revealedSSNs, setRevealedSSNs] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    position: "",
    department_id: "",
    ssn: "",
    salary: "",
    contact_number: "",
    user_email: "",
    employment_status: "active",
  });

  const role = user?.role || "employee";
  const isHR = role === "hr";
  const isManager = role === "manager";

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/employees");
      setEmployees(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data.data || []);
      if (res.data.data?.length > 0 && !formData.department_id) {
        setFormData((prev) => ({ ...prev, department_id: res.data.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/employees", {
        ...formData,
        salary: Number(formData.salary),
      });
      setIsCreateOpen(false);
      setFormData({
        full_name: "",
        position: "",
        department_id: departments[0]?._id || "",
        ssn: "",
        salary: "",
        contact_number: "",
        user_email: "",
        employment_status: "active",
      });
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating employee");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        full_name: formData.full_name,
        position: formData.position,
        department_id: formData.department_id,
        contact_number: formData.contact_number,
        employment_status: formData.employment_status,
      };
      if (isHR) {
        if (formData.salary) payload.salary = Number(formData.salary);
        if (formData.ssn) payload.ssn = formData.ssn;
      }
      await api.put(`/employees/${selectedEmployee._id}`, payload);
      setIsEditOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating employee");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee record? This action will be audited.")) {
      return;
    }
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting employee");
    }
  };

  const handleConfirmReveal = async () => {
    const { empId } = revealModal;
    try {
      const res = await api.get(`/employees/${empId}?reveal_ssn=true`);
      if (res.data.data?.ssn_unmasked) {
        setRevealedSSNs((prev) => ({
          ...prev,
          [empId]: res.data.data.ssn_unmasked,
        }));
      }
      setRevealModal({ open: false, empId: null, empName: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Error revealing SSN");
    }
  };

  const openEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      full_name: emp.full_name,
      position: emp.position,
      department_id: emp.department_id?._id || emp.department_id,
      ssn: "",
      salary: emp.salary,
      contact_number: emp.contact_number || "",
      user_email: emp.user_id?.email || "",
      employment_status: emp.employment_status || "active",
    });
    setIsEditOpen(true);
  };

  const filteredEmployees = employees.filter((emp) => {
    const nameMatch = emp.full_name?.toLowerCase().includes(search.toLowerCase());
    const posMatch = emp.position?.toLowerCase().includes(search.toLowerCase());
    const deptMatch = emp.department_id?.name?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || posMatch || deptMatch;
  });

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        <div>
          <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Users size={28} color="#818cf8" />
            {role === "employee" ? "My Personnel Record" : "Employee Directory"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            {isHR && "Manage organizational personnel, encrypted PII, compensation details, and department allocations."}
            {isManager && "View departmental team members and update profile contact numbers."}
            {role === "employee" && "Review your linked personal and employment profile details."}
          </p>
        </div>

        {isHR && (
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
            <UserPlus size={16} /> Add Employee
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      {role !== "employee" && (
        <div className="glass-panel" style={{
          padding: "0.85rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}>
          <Search size={18} color="var(--text-subtle)" />
          <input
            type="text"
            placeholder="Search employees by name, position, or department..."
            className="form-input"
            style={{ width: "100%", background: "transparent", border: "none", boxShadow: "none" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Table */}
      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading employee records...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No employee records found.
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Gov ID / SSN</th>
                <th>Salary</th>
                <th>Contact</th>
                <th>Status</th>
                {(isHR || isManager) && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const isSSNRevealed = !!revealedSSNs[emp._id];
                const displaySSN = isSSNRevealed ? revealedSSNs[emp._id] : emp.ssn_masked;

                return (
                  <tr key={emp._id}>
                    <td style={{ fontWeight: 600 }}>
                      {emp.full_name}
                      {emp.user_id && (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", fontWeight: 400 }}>
                          {emp.user_id.email}
                        </div>
                      )}
                    </td>
                    <td>{emp.position}</td>
                    <td>
                      <span className="badge badge-manager" style={{ fontSize: "0.7rem" }}>
                        {emp.department_id?.name || "General"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <code style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8rem",
                          color: isSSNRevealed ? "#34d399" : "var(--text-muted)",
                          background: "rgba(0,0,0,0.3)",
                          padding: "0.2rem 0.4rem",
                          borderRadius: "4px",
                        }}>
                          {displaySSN}
                        </code>

                        {isHR && (
                          <button
                            onClick={() => {
                              if (isSSNRevealed) {
                                const copy = { ...revealedSSNs };
                                delete copy[emp._id];
                                setRevealedSSNs(copy);
                              } else {
                                setRevealModal({
                                  open: true,
                                  empId: emp._id,
                                  empName: emp.full_name,
                                });
                              }
                            }}
                            title={isSSNRevealed ? "Hide decrypted SSN" : "Decrypt & reveal SSN (Audited)"}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: isSSNRevealed ? "#34d399" : "var(--accent-cyan)",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {isSSNRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: "#38bdf8" }}>
                      ${Number(emp.salary || 0).toLocaleString()}
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.825rem" }}>
                      {emp.contact_number || "—"}
                    </td>
                    <td>
                      <span className={`badge badge-${emp.employment_status === "active" ? "success" : "warning"}`}>
                        {emp.employment_status}
                      </span>
                    </td>
                    {(isHR || isManager) && (
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button
                            onClick={() => openEdit(emp)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Record"
                          >
                            <Edit2 size={13} />
                          </button>
                          {isHR && (
                            <button
                              onClick={() => handleDelete(emp._id)}
                              className="btn btn-danger btn-sm"
                              title="Delete Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* SSN Reveal Confirmation Modal (Audit Warning) */}
      {revealModal.open && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px", padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#f59e0b", marginBottom: "1rem" }}>
              <ShieldAlert size={26} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                PII Decryption & Access Warning
              </h3>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              You are requesting to decrypt and reveal the Government ID / SSN for employee:{" "}
              <strong style={{ color: "#fff" }}>{revealModal.empName}</strong>.
              <br /><br />
              Under InfoSec compliance policy, this decryption event will be permanently stamped in the{" "}
              <strong style={{ color: "#38bdf8" }}>Audit Log</strong> with your administrator credentials, client IP, and timestamp.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setRevealModal({ open: false, empId: null, empName: "" })}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleConfirmReveal} className="btn btn-primary">
                Acknowledge & Reveal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", color: "#fff" }}>Add New Employee</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Alexander Hayes"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Position *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g. Security Analyst"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    className="form-select"
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  >
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Gov ID / SSN * (Encrypted at rest)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.ssn}
                    onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                    placeholder="e.g. 123-45-6789"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Annual Salary ($) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="form-input"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g. 95000"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Link User Email (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.user_email}
                    onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                    placeholder="user@ems.secure"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Employee Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditOpen && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", color: "#fff" }}>Edit Employee Record</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  >
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isHR && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Update SSN (Leave blank to keep current)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.ssn}
                      onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                      placeholder="Enter new SSN to re-encrypt"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Annual Salary ($)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
