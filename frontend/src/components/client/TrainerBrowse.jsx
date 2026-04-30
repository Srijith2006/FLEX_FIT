import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

function StarRating({ value, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star ${n <= (hover || value) ? "filled" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(n)}
        >★</span>
      ))}
    </div>
  );
}

export default function TrainerBrowse() {
  const { token } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [selected, setSelected] = useState(null);
  const [ratings, setRatings] = useState({});
  const [actioning, setActioning] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/trainers");
      setTrainers(res.data.trainers || []);
    } catch {
      setMsg({ type: "error", text: "Failed to load trainers." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chooseTrainer = async (trainerId) => {
    setActioning(trainerId);
    setMsg({ type: "", text: "" });
    try {
      await api.post("/coaching", { trainerId, pricePerMonth: 49 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelected(trainerId);
      setMsg({ type: "success", text: "Trainer selected! They will be notified." });
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Could not select trainer." });
    } finally {
      setActioning(null);
    }
  };

  const rateTrainer = async (trainerId, rating) => {
    try {
      await api.post(`/trainers/${trainerId}/rating`, { rating }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRatings(r => ({ ...r, [trainerId]: rating }));
      setMsg({ type: "success", text: "Rating submitted!" });
      load();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Rating failed." });
    }
  };

  if (loading) return (
    <div className="card">
      <div className="loading-screen" style={{ minHeight: "200px" }}>
        <div className="spinner"></div><span>Loading trainers…</span>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="flex-between mb-4">
        <h3 className="font-heading" style={{ fontSize: "22px" }}>Browse Verified Trainers</h3>
        <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>
          {msg.text}
        </div>
      )}

      {trainers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏋️</div>
          <div className="empty-state-text">No verified trainers available yet. Check back soon!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {trainers.map((t) => (
            <div key={t._id} className="trainer-card">
              <div className="trainer-card-top">
                <div className="trainer-avatar">
                  {(t.user?.name || "T")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="trainer-name">{t.user?.name || "Trainer"}</div>
                  <div className="trainer-meta">{t.user?.email}</div>
                  {t.specialization?.length > 0 && (
                    <div className="specialization-tags mt-2">
                      {t.specialization.map(s => <span key={s} className="spec-tag">{s}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "var(--gold)" }}>
                    ★ {Number(t.avgRating || 0).toFixed(1)}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text3)" }}>{t.totalRatings || 0} reviews</div>
                </div>
              </div>

              {t.bio && <p className="trainer-bio">{t.bio}</p>}

              <div className="trainer-stats">
                <div className="trainer-stat">
                  <strong>{t.yearsOfExperience || 0}y</strong>
                  Experience
                </div>
                <div className="trainer-stat">
                  <strong>${t.hourlyRate || 0}/hr</strong>
                  Rate
                </div>
                <div className="trainer-stat">
                  <strong>{Number(t.score || 0).toFixed(1)}</strong>
                  Score
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex-between">
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text3)", marginBottom: "4px" }}>Rate this trainer</div>
                  <StarRating value={ratings[t._id] || 0} onRate={(r) => rateTrainer(t._id, r)} />
                </div>
                <button
                  className={`btn btn-sm ${selected === t._id ? "btn-success" : "btn-primary"}`}
                  onClick={() => chooseTrainer(t._id)}
                  disabled={actioning === t._id || selected === t._id}
                >
                  {actioning === t._id ? "…" : selected === t._id ? "✓ Selected" : "Choose Trainer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}