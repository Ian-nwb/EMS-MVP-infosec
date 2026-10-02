import React, { useState, useEffect } from "react";
import api from "../services/api";
import { CalendarCheck, Plus, CheckCircle, XCircle, Clock, X, MessageSquare } from "lucide-react";

export default function LeaveView({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Submit Form State
  const [formData, setFormData] = useState({
    leave_type: "vacation",
    start_date: "",
    end_date: "",
    reason: "",
  });

  // Review Form State
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [reviewerNotes, setReviewerNotes] = useState("");

  const role = user?.role || "employee";
  const canReview = role === "hr" || role === "manager";

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leave");
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/leave", formData);
      setIsSubmitOpen(false);
      setFormData({ leave_type: "vacation", start_date: "", end_date: "", reason: "" });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit leave request");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leave/${selectedLeave._id}/review`, {
        status: reviewStatus,
        reviewer_notes: reviewerNotes,
      });
      setIsReviewOpen(false);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review leave request");
    }
  };

  const openReview = (leave, status) => {
    setSelectedLeave(leave);
    setReviewStatus(status);
    setReviewerNotes("");
    setIsReviewOpen(true);
  };

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <CalendarCheck size={28} color="#fbbf24" /> Leave Management
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Submit time-off requests and manage departmental approval workflows.
          </p>
        </div>

        <button onClick={() => setIsSubmitOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Request Time Off
        </button>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading leave requests...
          </div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No leave requests found.
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Reviewed By</th>
                {canReview && <th style={{ textAlign: "right" }}>Review</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  <td style={{ fontWeight: 600 }}>
                    {leave.employee_id?.full_name || "Self"}
                    {leave.employee_id?.department_id?.name && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", fontWeight: 400 }}>
                        {leave.employee_id.department_id.name}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-employee" style={{ fontSize: "0.72rem" }}>
                      {leave.leave_type}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.825rem", whiteSpace: "nowrap" }}>
                    {new Date(leave.start_date).toLocaleDateString()} &rarr; {new Date(leave.end_date).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: "0.825rem", color: "var(--text-muted)", maxWidth: "250px" }}>
                    {leave.reason}
                    {leave.reviewer_notes && (
                      <div style={{ fontSize: "0.725rem", color: "#38bdf8", marginTop: "0.2rem", fontStyle: "italic" }}>
                        Note: {leave.reviewer_notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${leave.status === "approved" ? "success" : leave.status === "rejected" ? "danger" : "warning"}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>
                    {leave.reviewed_by?.email || "Pending"}
                  </td>
                  {canReview && (
                    <td style={{ textAlign: "right" }}>
                      {leave.status === "pending" ? (
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button
                            onClick={() => openReview(leave, "approved")}
                            className="btn btn-success btn-sm"
                            title="Approve"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => openReview(leave, "rejected")}
                            className="btn btn-danger btn-sm"
                            title="Reject"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>Completed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Submit Leave Request Modal */}
      {isSubmitOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", color: "#fff" }}>Request Leave of Absence</h3>
              <button
                onClick={() => setIsSubmitOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Leave Category</label>
                <select
                  className="form-select"
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                >
                  <option value="vacation">Vacation / Annual</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="maternity">Maternity / Paternity</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Request *</label>
                <textarea
                  rows="3"
                  required
                  className="form-textarea"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide context for manager review..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setIsSubmitOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewOpen && selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", color: "#fff" }}>
                Review Leave Request: {selectedLeave.employee_id?.full_name}
              </h3>
              <button
                onClick={() => setIsReviewOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: "1rem", padding: "1rem", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <strong>Type:</strong> {selectedLeave.leave_type} |{" "}
                  <strong>Duration:</strong> {new Date(selectedLeave.start_date).toLocaleDateString()} to {new Date(selectedLeave.end_date).toLocaleDateString()}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#fff", marginTop: "0.4rem" }}>
                  <strong>Reason:</strong> {selectedLeave.reason}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Decision</label>
                <select
                  className="form-select"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                >
                  <option value="approved">Approve Request</option>
                  <option value="rejected">Reject Request</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Manager / HR Reviewer Notes</label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Optional notes or feedback..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setIsReviewOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${reviewStatus === "approved" ? "btn-success" : "btn-danger"}`}
                >
                  Confirm {reviewStatus === "approved" ? "Approval" : "Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
