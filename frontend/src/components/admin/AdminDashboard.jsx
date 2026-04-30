import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [allTrainers, setAllTrainers] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [actioning, setActioning] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      // Admin needs to see all trainers including pending — fetch with token
      const res = await api.get("/trainers/all", {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => api.get("/trainers"));
      setAllTrainers(res.data.trainers || []);
    } catch {
      setMsg({ type: "error", text: "Failed to load trainers." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const review = async (trainerId, status) => {
    setActioning(trainerId);
    setMsg({ type: "", text: "" });
    try {
      await api.patch(`/trainers/${trainerId}/review`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: "success", text: `Trainer ${status} successfully.` });
      load();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Action failed." });
    } finally {
      setActioning(null);
    }
  };

  const filtered = allTrainers.filter(t => {
    if (filter === "all") return true;
    return t.verificationStatus === filter;
  });

  const counts = {
    pending: allTrainers.filter(t => t.verificationStatus === "pending").length,
    approved: allTrainers.filter(t => t.verificationStatus === "approved").length,
    rejected: allTrainers.filter(t => t.verificationStatus === "rejected").length,
  };

  return (
    <>
      {/* Stats */}
      <div className="grid-3">
        <div className="stat-card">
          <div className="stat-card-icon icon-gold">⏳</div>
          <div className="stat-card-value" style={{ color: "var(--gold)" }}>{counts.pending}</div>
          <div className="stat-card-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-green">✅</div>
          <div className="stat-card-value" style={{ color: "var(--green)" }}>{counts.approved}</div>
          <div className="stat-card-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue">❌</div>
          <div className="stat-card-value" style={{ color: "var(--red)" }}>{counts.rejected}</div>
          <div className="stat-card-label">Rejected</div>
        </div>
      </div>

      {/* Queue */}
      <div className="card">
        <div className="flex-between mb-4">
          <h3 className="font-heading" style={{ fontSize: "22px" }}>Trainer Applications</h3>
          <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
        </div>

        {/* Filter tabs */}
        <div className="tabs">
          {["pending", "approved", "rejected", "all"].map(f => (
            <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && <span style={{ marginLeft: "6px", color: "var(--text3)", fontSize: "12px" }}>({counts[f] || 0})</span>}
            </button>
          ))}
        </div>

        {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>}

        {loading ? (
          <div className="loading-screen" style={{ minHeight: "160px" }}>
            <div className="spinner"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-text">No {filter === "all" ? "" : filter} applications.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map(t => (
              <div key={t._id} style={{
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "16px",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "6px" }}>
                    <div className="trainer-avatar" style={{ width: "36px", height: "36px", fontSize: "15px", borderRadius: "10px" }}>
                      {(t.user?.name || "T")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.user?.name || "Unknown"}</div>
                      <div style={{ fontSize: "12px", color: "var(--text3)" }}>{t.user?.email}</div>
                    </div>
                    <span className={`tag tag-${t.verificationStatus}`}>{t.verificationStatus}</span>
                  </div>
                  {t.bio && <p style={{ color: "var(--text2)", fontSize: "13px", marginBottom: "6px" }}>{t.bio}</p>}
                  {t.certificateUrl ? (
                    <a
                      href={`http://localhost:5000${t.certificateUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--accent2)", fontSize: "12px", textDecoration: "none" }}
                    >
                      📎 View Certificate
                    </a>
                  ) : (
                    <span style={{ color: "var(--text3)", fontSize: "12px" }}>No certificate uploaded</span>
                  )}
                </div>

                {t.verificationStatus === "pending" && (
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => review(t._id, "approved")}
                      disabled={actioning === t._id}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => review(t._id, "rejected")}
                      disabled={actioning === t._id}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}