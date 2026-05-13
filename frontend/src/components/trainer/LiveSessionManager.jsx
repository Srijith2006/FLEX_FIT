// frontend/src/components/trainer/LiveSessionManager.jsx
//
// READ-ONLY overview of all sessions across all of the trainer's programs.
// Sessions are now scheduled from within each program's manage page
// (TrainerProgramManager → ProgramLiveSessions), so the "Schedule Session"
// button has been removed here to avoid confusion.

import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

function formatDT(d) {
  return new Date(d).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isLive(s) {
  const now   = Date.now();
  const start = new Date(s.scheduledAt).getTime();
  return now >= start && now <= start + s.durationMinutes * 60000;
}

function isUpcoming(s) {
  return new Date(s.scheduledAt).getTime() > Date.now();
}

export default function LiveSessionManager() {
  const { token }       = useAuth();
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");   // "all" | "upcoming" | "live"
  const [msg,       setMsg]       = useState({ type: "", text: "" });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sessions/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data.sessions || []);
    } catch {
      setMsg({ type: "error", text: "Failed to load sessions." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deleteSession = async (id) => {
    if (!confirm("Delete this session? Enrolled clients will no longer see it.")) return;
    try {
      await api.delete(`/sessions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch {
      setMsg({ type: "error", text: "Failed to delete session." });
    }
  };

  // ── filtered list ──────────────────────────────────────────────────────────
  const visible = sessions.filter(s => {
    if (filter === "live")     return isLive(s);
    if (filter === "upcoming") return isUpcoming(s) && !isLive(s);
    return true;
  });

  const liveCount     = sessions.filter(isLive).length;
  const upcomingCount = sessions.filter(s => isUpcoming(s) && !isLive(s)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="card">

        {/* ── Header ── */}
        <div className="flex-between mb-4">
          <div>
            <h3 className="font-heading" style={{ fontSize: "22px", marginBottom: "4px" }}>
              Live Sessions
            </h3>
            <div style={{ fontSize: "12px", color: "var(--text3)" }}>
              Schedule sessions from within each program's Manage page.
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={load}
            style={{ flexShrink: 0 }}
            title="Refresh"
          >
            ↻ Refresh
          </button>
        </div>

        {/* ── Info banner ── */}
        <div style={{
          background: "rgba(0,112,243,0.07)",
          border: "1px solid rgba(0,112,243,0.18)",
          borderRadius: "10px",
          padding: "12px 16px",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: "12px", color: "var(--text2)", lineHeight: "1.6" }}>
            Sessions are now <strong>program-scoped</strong> — each session is visible only to clients
            enrolled in that specific program. To schedule a new session, open
            <strong> My Programs → Manage → Live Sessions</strong>.
          </div>
        </div>

        {/* ── Filter pills ── */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          {[
            { key: "all",      label: `All (${sessions.length})` },
            { key: "live",     label: `🔴 Live (${liveCount})` },
            { key: "upcoming", label: `📅 Upcoming (${upcomingCount})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${filter === f.key ? "var(--accent)" : "var(--border)"}`,
                background: filter === f.key ? "var(--accent)" : "transparent",
                color: filter === f.key ? "#fff" : "var(--text2)",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {msg.text && (
          <div
            className={`alert alert-${msg.type === "error" ? "error" : "success"}`}
            style={{ marginBottom: "12px" }}
          >
            {msg.text}
            <button
              onClick={() => setMsg({ type: "", text: "" })}
              style={{ background: "none", border: "none", marginLeft: "auto", cursor: "pointer", color: "inherit" }}
            >✕</button>
          </div>
        )}

        {/* ── Session list ── */}
        {loading ? (
          <div className="loading-screen" style={{ minHeight: "140px" }}>
            <div className="spinner"></div>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎥</div>
            <div className="empty-state-text">
              {filter === "live"
                ? "No sessions are live right now."
                : filter === "upcoming"
                ? "No upcoming sessions scheduled."
                : "No sessions yet. Schedule one from a program's Manage page."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {visible.map(s => (
              <div
                key={s._id}
                style={{
                  background: isLive(s) ? "rgba(16,185,129,0.06)" : "var(--bg3)",
                  border: `1px solid ${isLive(s) ? "var(--green)" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title + live badge */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>{s.title}</span>
                    {isLive(s) && (
                      <span className="tag tag-approved" style={{ animation: "pulse 1.5s infinite" }}>
                        🔴 LIVE NOW
                      </span>
                    )}
                  </div>

                  {/* Program label */}
                  {s.program?.title && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      fontSize: "10px", fontWeight: 700, color: "var(--accent2)",
                      background: "rgba(0,112,243,0.08)", border: "1px solid rgba(0,112,243,0.15)",
                      padding: "2px 8px", borderRadius: "20px", marginBottom: "5px",
                    }}>
                      📋 {s.program.title}
                    </div>
                  )}

                  {/* Time + duration */}
                  <div style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "3px" }}>
                    {formatDT(s.scheduledAt)} · {s.durationMinutes} min
                  </div>

                  {s.description && (
                    <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "4px" }}>
                      {s.description}
                    </div>
                  )}

                  <a
                    href={s.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "12px", color: "var(--accent2)", wordBreak: "break-all" }}
                  >
                    🔗 {s.meetingLink}
                  </a>
                </div>

                {/* Delete */}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteSession(s._id)}
                  style={{ flexShrink: 0 }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}