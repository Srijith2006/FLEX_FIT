import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

function getYTEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
}

function formatDateTime(d) {
  return new Date(d).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isLive(session) {
  const now = Date.now();
  const start = new Date(session.scheduledAt).getTime();
  const end = start + session.durationMinutes * 60000;
  return now >= start && now <= end;
}

export default function MyPrograms() {
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState(null);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [eRes, sRes] = await Promise.all([
          api.get("/programs/enrolled", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/sessions/for-me", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const enrs = eRes.data.enrollments || [];
        setEnrollments(enrs);
        setSessions(sRes.data.sessions || []);
        if (enrs.length > 0) setActiveProgram(enrs[0].program);
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div className="card loading-screen" style={{ minHeight: "200px" }}>
      <div className="spinner"></div>
    </div>
  );

  if (enrollments.length === 0) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <div className="empty-state-text">You haven't enrolled in any programs yet. Browse the marketplace!</div>
      </div>
    </div>
  );

  const days = activeProgram?.days || [];
  const currentDay = days[activeDay];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Upcoming Live Sessions */}
      {sessions.length > 0 && (
        <div className="card">
          <h3 className="font-heading" style={{ fontSize: "20px", marginBottom: "14px" }}>🎥 Upcoming Live Sessions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {sessions.map(s => (
              <div key={s._id} style={{
                background: "var(--bg3)", border: `1px solid ${isLive(s) ? "var(--green)" : "var(--border)"}`,
                borderRadius: "var(--radius)", padding: "14px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px",
              }}>
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700 }}>{s.title}</span>
                    {isLive(s) && <span className="tag tag-approved" style={{ animation: "pulse 1.5s infinite" }}>🔴 LIVE NOW</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text3)" }}>
                    by {s.trainer?.user?.name} · {formatDateTime(s.scheduledAt)} · {s.durationMinutes}min
                  </div>
                  {s.description && <div style={{ fontSize: "12px", color: "var(--text2)", marginTop: "4px" }}>{s.description}</div>}
                </div>
                <a
                  href={s.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className={`btn btn-sm ${isLive(s) ? "btn-accent" : "btn-outline"}`}
                  style={{ flexShrink: 0 }}
                >
                  {isLive(s) ? "Join Now 🚀" : "Add to Calendar"}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Program selector */}
      {enrollments.length > 1 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {enrollments.map(e => (
            <button
              key={e._id}
              className={`btn btn-sm ${activeProgram?._id === e.program?._id ? "btn-primary" : "btn-outline"}`}
              onClick={() => { setActiveProgram(e.program); setActiveDay(0); }}
            >
              {e.program?.title}
            </button>
          ))}
        </div>
      )}

      {/* Active program */}
      {activeProgram && (
        <div className="card">
          <div style={{ marginBottom: "16px" }}>
            <h3 className="font-heading" style={{ fontSize: "22px", marginBottom: "4px" }}>{activeProgram.title}</h3>
            <div style={{ color: "var(--text2)", fontSize: "13px" }}>
              by {activeProgram.trainer?.user?.name} · {activeProgram.durationWeeks}w program · {days.length} training days
            </div>
          </div>

          {/* Day tabs */}
          {days.length > 0 && (
            <>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
                {days.map((d, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${activeDay === i ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setActiveDay(i)}
                  >
                    Day {d.dayNumber}
                  </button>
                ))}
              </div>

              {currentDay && (
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: "16px", marginBottom: "14px", color: "var(--accent)" }}>
                    Day {currentDay.dayNumber}{currentDay.title ? ` — ${currentDay.title}` : ""}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {currentDay.exercises.map((ex, i) => {
                      const embed = getYTEmbed(ex.videoUrl);
                      return (
                        <div key={i} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "15px" }}>{ex.name}</div>
                              {ex.notes && <div style={{ color: "var(--text2)", fontSize: "12px", marginTop: "2px" }}>{ex.notes}</div>}
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "var(--text)" }}>
                                {ex.sets}×{ex.reps}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text3)" }}>
                                {ex.weight ? `${ex.weight}kg` : "bodyweight"} · rest {ex.restSeconds}s
                              </div>
                            </div>
                          </div>
                          {embed && (
                            <div style={{ borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9" }}>
                              <iframe src={embed} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={ex.name} />
                            </div>
                          )}
                          {ex.videoUrl && !embed && (
                            <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: "8px" }}>▶ Watch Video</a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {days.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-text">Trainer hasn't added workouts yet. Check back soon.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}