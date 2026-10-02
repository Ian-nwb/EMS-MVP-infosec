import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle } from "lucide-react";

export default function AttendanceView({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get("/attendance");
      setRecords(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleCheckIn = async () => {
    setMessage({ text: "", type: "" });
    try {
      const res = await api.post("/attendance/check-in", { notes });
      setMessage({ text: "Clock-in recorded successfully!", type: "success" });
      setNotes("");
      fetchAttendance();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Failed to clock in",
        type: "error",
      });
    }
  };

  const handleCheckOut = async () => {
    setMessage({ text: "", type: "" });
    try {
      const res = await api.post("/attendance/check-out");
      setMessage({ text: "Clock-out recorded successfully!", type: "success" });
      fetchAttendance();
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Failed to clock out",
        type: "error",
      });
    }
  };

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Clock size={28} color="#06b6d4" /> Attendance & Time Tracking
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
          Real-time daily punch clock and timestamped attendance logs.
        </p>
      </div>

      {/* Punch Clock Station */}
      <div className="glass-panel" style={{
        padding: "2rem",
        borderRadius: "var(--radius-lg)",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.5rem",
        background: "linear-gradient(135deg, rgba(22, 30, 49, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Live System Time
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "2.2rem", fontWeight: 700, color: "#fff", margin: "0.25rem 0" }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {currentTime.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "400px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Optional check-in notes (e.g. Remote work, standup)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={handleCheckIn} className="btn btn-primary" style={{ flex: 1, padding: "0.75rem" }}>
              <LogIn size={16} /> Clock In
            </button>
            <button onClick={handleCheckOut} className="btn btn-secondary" style={{ flex: 1, padding: "0.75rem" }}>
              <LogOut size={16} /> Clock Out
            </button>
          </div>

          {message.text && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8rem",
              color: message.type === "success" ? "#86efac" : "#fca5a5",
            }}>
              {message.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="glass-panel table-container">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading attendance records...
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No attendance entries recorded yet.
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec._id}>
                  <td style={{ fontWeight: 600 }}>
                    {rec.employee_id?.full_name || "Self"}
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {new Date(rec.date).toLocaleDateString()}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#34d399" }}>
                    {rec.check_in ? new Date(rec.check_in).toLocaleTimeString() : "—"}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#38bdf8" }}>
                    {rec.check_out ? new Date(rec.check_out).toLocaleTimeString() : "In Progress"}
                  </td>
                  <td>
                    <span className={`badge badge-${rec.status === "present" ? "success" : rec.status === "late" ? "warning" : "danger"}`}>
                      {rec.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {rec.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
