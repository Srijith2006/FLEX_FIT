import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "weight_loss", label: "Weight Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" },
  { value: "general", label: "General" },
];

function getYTEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
}

function ProgramCard({ program, onEnroll, enrolling, enrolled }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: "var(--surface)", border: `1px solid ${enrolled ? "var(--green)" : "var(--border)"}`,
      borderRadius: "var(--radius-lg)", overflow: "hidden",
      transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
      boxShadow: enrolled ? "0 0 20px rgba(16,185,129,0.1)" : "none",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
              <span className="tag tag-active" style={{ textTransform: "capitalize" }}>
                {program.category?.replace("_", " ")}
              </span>
              {enrolled && <span className="tag tag-approved">✓ Enrolled</span>}
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "17px", marginBottom: "4px" }}>{program.title}</h3>
            <p style={{ color: "var(--text2)", fontSize: "13px" }}>{program.description}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "var(--accent)", lineHeight: 1 }}>
              ${program.price}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>one-time</div>
          </div>
        </div>

        {/* Trainer info */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px", background: "var(--bg3)", borderRadius: "var(--radius)", marginBottom: "12px" }}>
          <div className="trainer-avatar" style={{ width: "36px", height: "36px", fontSize: "14px", borderRadius: "10px", flexShrink: 0 }}>
            {(program.trainer?.user?.name || "T")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>{program.trainer?.user?.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>
              {program.trainer?.yearsOfExperience || 0}y experience · ★ {Number(program.trainer?.avgRating || 0).toFixed(1)} rating
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "var(--text3)" }}>
            {program.durationWeeks}w · {program.days?.length || 0} days · {program.enrolledCount} enrolled
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
          {program.trainer?.specialization?.slice(0, 3).map(s => (
            <span key={s} className="spec-tag">{s}</span>
          ))}
        </div>
      </div>

      {/* Expandable days preview */}
      {program.days?.length > 0 && (
        <div style={{ padding: "0 20px" }}>
          <button
            className="btn btn-outline btn-sm btn-full"
            onClick={() => setExpanded(e => !e)}
            style={{ marginBottom: "12px" }}
          >
            {expanded ? "▲ Hide Program Details" : `▼ View ${program.days.length}-Day Schedule`}
          </button>

          {expanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
              {program.days.map((day, i) => (
                <div key={i} style={{ background: "var(--bg3)", borderRadius: "var(--radius)", padding: "14px", border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px", color: "var(--accent)" }}>
                    Day {day.dayNumber}{day.title ? ` — ${day.title}` : ""}
                  </div>
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} style={{ marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                        <span>{ex.name}</span>
                        <span style={{ color: "var(--text3)" }}>{ex.sets}×{ex.reps}{ex.weight ? ` @ ${ex.weight}kg` : ""}</span>
                      </div>
                      {ex.notes && <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>{ex.notes}</div>}
                      {ex.videoUrl && (() => {
                        const embed = getYTEmbed(ex.videoUrl);
                        return embed ? (
                          <div style={{ marginTop: "8px", borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9" }}>
                            <iframe src={embed} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={ex.name} />
                          </div>
                        ) : (
                          <a href={ex.videoUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accent2)" }}>▶ Watch video</a>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "14px 20px 20px" }}>
        {enrolled ? (
          <div className="alert alert-success">✓ You're enrolled in this program</div>
        ) : (
          <button
            className="btn btn-accent btn-full"
            onClick={() => onEnroll(program._id, program.price)}
            disabled={enrolling === program._id}
          >
            {enrolling === program._id
              ? <><span className="spinner" style={{ borderTopColor: "#fff" }}></span> Processing…</>
              : `Enroll Now — $${program.price}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProgramMarketplace() {
  const { token } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;
      const [progsRes, enrollRes] = await Promise.all([
        api.get("/programs", { params }),
        api.get("/programs/enrolled", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setPrograms(progsRes.data.programs || []);
      setEnrollments(enrollRes.data.enrollments?.map(e => String(e.program?._id)) || []);
    } catch {
      setMsg({ type: "error", text: "Failed to load programs." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [category]);

  const enroll = async (programId) => {
    setEnrolling(programId);
    setMsg({ type: "", text: "" });
    try {
      await api.post(`/programs/${programId}/enroll`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setEnrollments(e => [...e, programId]);
      setMsg({ type: "success", text: "🎉 Enrolled successfully! Check My Programs to start." });
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Enrollment failed." });
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Filters */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="form-input"
            placeholder="Search programs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            style={{ maxWidth: "260px" }}
          />
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                className={`btn btn-sm ${category === c.value ? "btn-primary" : "btn-outline"}`}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={load} style={{ marginLeft: "auto" }}>↻ Refresh</button>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"}`}>{msg.text}</div>}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: "200px" }}>
          <div className="spinner"></div><span>Loading programs…</span>
        </div>
      ) : programs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No programs found. Try a different filter.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {programs.map(p => (
            <ProgramCard
              key={p._id}
              program={p}
              enrolled={enrollments.includes(String(p._id))}
              enrolling={enrolling}
              onEnroll={enroll}
            />
          ))}
        </div>
      )}
    </div>
  );
}