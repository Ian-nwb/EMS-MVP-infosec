import React, { useState, useEffect } from "react";
import api from "../services/api";
import { CreditCard, Plus, FileText, Trash2, X, Download, Shield } from "lucide-react";

export default function PayrollView({ user }) {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: "",
    basic_salary: "",
    allowances: 0,
    deductions: 0,
    pay_period: "October 2026",
    status: "processed",
  });

  const role = user?.role || "employee";
  const isHR = role === "hr";

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payroll");
      setPayrolls(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isHR) return;
    try {
      const res = await api.get("/employees");
      setEmployees(res.data.data || []);
      if (res.data.data?.length > 0 && !formData.employee_id) {
        setFormData((prev) => ({
          ...prev,
          employee_id: res.data.data[0]._id,
          basic_salary: (res.data.data[0].salary / 12).toFixed(2),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [user]);

  const handleEmployeeChange = (empId) => {
    const emp = employees.find((e) => e._id === empId);
    setFormData({
      ...formData,
      employee_id: empId,
      basic_salary: emp ? (emp.salary / 12).toFixed(2) : "",
    });
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/payroll", {
        ...formData,
        basic_salary: Number(formData.basic_salary),
        allowances: Number(formData.allowances || 0),
        deductions: Number(formData.deductions || 0),
      });
      setIsGenerateOpen(false);
      fetchPayrolls();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate payroll");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payroll record?")) return;
    try {
      await api.delete(`/payroll/${id}`);
      fetchPayrolls();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete payroll record");
    }
  };

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <CreditCard size={28} color="#34d399" /> Payroll & Compensation
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            {isHR
              ? "Generate monthly payslips, manage deductions, and audit compensation disbursement."
              : "Review your official salary statements and deduction vouchers."}
          </p>
        </div>

        {isHR && (
          <button onClick={() => setIsGenerateOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Generate Payroll
          </button>
        )}
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading payroll records...
          </div>
        ) : payrolls.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No payroll records found.
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Period</th>
                <th>Basic Pay</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Payout</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((pay) => (
                <tr key={pay._id}>
                  <td style={{ fontWeight: 600 }}>
                    {pay.employee_id?.full_name || "Self"}
                    {pay.employee_id?.department_id?.name && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", fontWeight: 400 }}>
                        {pay.employee_id.department_id.name}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: "0.825rem" }}>{pay.pay_period}</td>
                  <td>${Number(pay.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: "#34d399" }}>
                    +${Number(pay.allowances || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ color: "#f87171" }}>
                    -${Number(pay.deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ fontWeight: 700, color: "#38bdf8", fontSize: "0.95rem" }}>
                    ${Number(pay.net_pay).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`badge badge-${pay.status === "paid" ? "success" : "warning"}`}>
                      {pay.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                      <button
                        onClick={() => setActiveVoucher(pay)}
                        className="btn btn-secondary btn-sm"
                        title="View Detailed Payslip Voucher"
                      >
                        <FileText size={14} /> Voucher
                      </button>
                      {isHR && (
                        <button
                          onClick={() => handleDelete(pay._id)}
                          className="btn btn-danger btn-sm"
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Payroll Modal */}
      {isGenerateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", color: "#fff" }}>Generate Compensation Record</h3>
              <button
                onClick={() => setIsGenerateOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit}>
              <div className="form-group">
                <label className="form-label">Select Employee *</label>
                <select
                  className="form-select"
                  value={formData.employee_id}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.full_name} ({emp.position}) - ${Number(emp.salary).toLocaleString()}/yr
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Pay Period *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.pay_period}
                    onChange={(e) => setFormData({ ...formData, pay_period: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="processed">Processed</option>
                    <option value="paid">Paid</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Basic Salary ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="form-input"
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Allowances ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deductions ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  />
                </div>
              </div>

              {/* Live Net Pay Preview */}
              <div style={{
                background: "rgba(15, 23, 42, 0.7)",
                padding: "0.85rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Calculated Net Payout:</span>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#38bdf8" }}>
                  ${(
                    Number(formData.basic_salary || 0) +
                    Number(formData.allowances || 0) -
                    Number(formData.deductions || 0)
                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" onClick={() => setIsGenerateOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Payslip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Voucher Modal */}
      {activeVoucher && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px", padding: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)", padding: "0.45rem", borderRadius: "8px" }}>
                  <Shield size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>OFFICIAL PAYSLIP VOUCHER</h3>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>NEVERIO SECURE ENTERPRISE SYSTEMS</div>
                </div>
              </div>

              <button
                onClick={() => setActiveVoucher(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "var(--text-subtle)", display: "block" }}>Employee Name</span>
                <strong style={{ color: "#fff" }}>{activeVoucher.employee_id?.full_name}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-subtle)", display: "block" }}>Pay Period</span>
                <strong style={{ color: "#fff" }}>{activeVoucher.pay_period}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-subtle)", display: "block" }}>Department / Position</span>
                <strong style={{ color: "#fff" }}>
                  {activeVoucher.employee_id?.department_id?.name || "General"} &bull; {activeVoucher.employee_id?.position}
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--text-subtle)", display: "block" }}>Disbursement Date</span>
                <strong style={{ color: "#fff" }}>{new Date(activeVoucher.pay_date).toLocaleDateString()}</strong>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div style={{ background: "rgba(15, 23, 42, 0.7)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Basic Salary</span>
                <span style={{ color: "#fff" }}>${Number(activeVoucher.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Performance & Remote Allowances</span>
                <span style={{ color: "#34d399" }}>+${Number(activeVoucher.allowances || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Statutory Deductions (Tax / SSS / PhilHealth)</span>
                <span style={{ color: "#f87171" }}>-${Number(activeVoucher.deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem", marginTop: "0.5rem", display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 800 }}>
                <span style={{ color: "#fff" }}>Net Pay Credited</span>
                <span style={{ color: "#38bdf8" }}>${Number(activeVoucher.net_pay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={`badge badge-${activeVoucher.status === "paid" ? "success" : "warning"}`}>
                Status: {activeVoucher.status}
              </span>
              <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
                <Download size={14} /> Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
