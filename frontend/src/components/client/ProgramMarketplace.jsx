import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";
import RazorpayCheckout from "../common/RazorpayCheckout.jsx";

const CATEGORIES = [
  { value: "",            label: "All"          },
  { value: "weight_loss", label: "Weight Loss"  },
  { value: "muscle_gain", label: "Muscle Gain"  },
  { value: "strength",    label: "Strength"     },
  { value: "cardio",      label: "Cardio"       },
  { value: "flexibility", label: "Flexibility"  },
  { value: "general",     label: "General"      },
];

function getYTEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
}

function ProgramCard({ program, enrolled, onEnrolled }) {
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSuccess = ({ paymentId, enrollment }) => {
    setPaying(false);
    setSuccessMsg(`🎉 Payment successful! Payment ID: ${paymentId}`);
    onEnrolled(program._id);
  };

  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${enrolled ? "var(--green)" : "var(--border)"}`,
      borderRadius: "var(--radius-lg)", overflow: "hidden",
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
              ₹{program.price}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>one-time</div>
          </div>
        </div>

        {/* Trainer row */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px", background: "var(--bg3)", borderRadius: "var(--radius)", marginBottom: "12px" }}>
          <div className="trainer-avatar" style={{ width: "36px", height: "36px", fontSize: "14px", borderRadius: "10px", flexShrink: 0 }}>
            {(program.trainer?.user?.name || "T")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>{program.trainer?.user?.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>
              {program.trainer?.yearsOfExperience || 0}y exp · ★ {Number(program.trainer?.avgRating || 0).toFixed(1)}
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "var(--text3)", textAlign: "right" }}>
            {program.durationWeeks}w · {program.days?.length || 0} days<br />
            {program.enrolledCount} enrolled
          </div>
        </div>

        {program.trainer?.specialization?.length > 0 && (
          <div className="specialization-tags" style={{ marginBottom: "12px" }}>
            {program.trainer.specialization.slice(0, 3).map(s => (
              <span key={s} className="spec-tag">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Expand schedule */}
      {program.days?.length > 0 && (
        <div style={{ padding: "0 20px" }}>
          <button className="btn btn-outline btn-sm btn-full" onClick={() => setExpanded(e => !e)} style={{ marginBottom: "12px" }}>
            {expanded ? "▲ Hide Schedule" : `▼ View ${program.days.length}-Day Schedule`}
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
                      {ex.videoUrl && (() => {
                        const embed = getYTEmbed(ex.videoUrl);
                        return embed
                          ? <div style={{ marginTop: "8px", borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9" }}>
                              <iframe src={embed} style={{ width: "100%", height: "100%", border: "none" }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen title={ex.name} />
                            </div>
                          : <a href={ex.videoUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accent2)" }}>▶ Watch video</a>;
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
        {successMsg && <div className="alert alert-success" style={{ marginBottom: "10px" }}>{successMsg}</div>}

        {enrolled ? (
          <div className="alert alert-success">✓ You're enrolled in this program</div>
        ) : paying ? (
          <div>
            <RazorpayCheckout
              program={program}
              onSuccess={handleSuccess}
              onClose={() => setPaying(false)}
            />
            <button className="btn btn-outline btn-sm btn-full" onClick={() => setPaying(false)} style={{ marginTop: "8px" }}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn-accent btn-full" onClick={() => setPaying(true)}>
            {program.price === 0 ? "Enroll Free" : `Enroll Now — ₹${program.price}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProgramMarketplace() {
  const { token } = useAuth();
  const [programs, setPrograms]       = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [category, setCategory]       = useState("");
  const [search, setSearch]           = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (search)   params.search   = search;

      const [progsRes, enrollRes] = await Promise.all([
        api.get("/programs", { params }),
        api.get("/programs/enrolled", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setPrograms(progsRes.data.programs || []);
      setEnrollments(
        enrollRes.data.enrollments?.map(e => String(e.program?._id)) || []
      );
    } catch {
      setError("Failed to load programs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [category]);

  const handleEnrolled = (programId) => {
    setEnrollments(prev => [...prev, String(programId)]);
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
            style={{ maxWidth: "240px" }}
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
          <button className="btn btn-outline btn-sm" onClick={load} style={{ marginLeft: "auto" }}>↻</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
              onEnrolled={handleEnrolled}
            />
          ))}
        </div>
      )}
    </div>
  );
}