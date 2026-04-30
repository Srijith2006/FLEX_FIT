import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const fmt = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function ProgressTracker() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/workouts/logs/mine", { headers: { Authorization: `Bearer ${token}` } });
        setLogs(res.data.logs || []);
      } catch (e) { setError(e?.response?.data?.message || "Failed to load logs."); }
      finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return <div className="card"><div className="loading-screen" style={{ minHeight: "180px" }}><div className="spinner"></div><span>Loading…</span></div></div>;

  return (
    <div className="card">
      <h3 className="font-heading" style={{ fontSize: "22px", marginBottom: "20px" }}>My Progress</h3>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      {logs.length >= 2 && (() => {
        const diff = (logs[0].weight - logs[logs.length - 1].weight).toFixed(1);
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div className="stat-card"><div className="stat-card-value" style={{ color: "var(--accent)", fontSize: "28px" }}>{logs[0].weight} kg</div><div className="stat-card-label">Current Weight</div></div>
            <div className="stat-card"><div className="stat-card-value" style={{ color: diff < 0 ? "var(--green)" : "var(--gold)", fontSize: "28px" }}>{diff > 0 ? "+" : ""}{diff} kg</div><div className="stat-card-label">Change (all time)</div></div>
            <div className="stat-card"><div className="stat-card-value" style={{ fontSize: "28px" }}>{logs.length}</div><div className="stat-card-label">Sessions Logged</div></div>
          </div>
        );
      })()}
      {logs.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📈</div><div className="empty-state-text">No workout logs yet. Start logging to track your progress!</div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {logs.map(log => (
            <div key={log._id} className="log-entry">
              <div>
                <div className="log-date">{fmt(log.date || log.createdAt)}</div>
                <div className="log-weight">{log.weight > 0 ? `${log.weight} kg` : "—"}</div>
                {log.notes && <div className="log-notes">{log.notes}</div>}
                {log.completedExercises?.length > 0 && (
                  <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {log.completedExercises.map((ex, i) => <span key={i} className="spec-tag">{ex.name} {ex.sets}×{ex.reps}</span>)}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: "11px", color: "var(--text3)" }}>{log.completedExercises?.length || 0} exercises</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}