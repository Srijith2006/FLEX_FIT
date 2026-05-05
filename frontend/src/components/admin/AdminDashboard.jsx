import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

// ── Reusable status badge ──────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const colors = { pending: "var(--gold)", approved: "var(--green)", rejected: "var(--red)" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
      background: `${colors[status]}22`, color: colors[status], border: `1px solid ${colors[status]}44`,
      textTransform: "uppercase", letterSpacing: 1,
    }}>{status}</span>
  );
};

// ── Filter tabs ────────────────────────────────────────────────────────────────
const FilterTabs = ({ filter, setFilter, counts }) => (
  <div className="tabs">
    {["pending", "approved", "rejected", "all"].map(f => (
      <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
        {f.charAt(0).toUpperCase() + f.slice(1)}
        {f !== "all" && <span style={{ marginLeft: 6, color: "var(--text3)", fontSize: 12 }}>({counts[f] || 0})</span>}
      </button>
    ))}
  </div>
);

// ── Trainer section ────────────────────────────────────────────────────────────
function TrainerReview({ token }) {
  const [trainers, setTrainers] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [actioning, setActioning] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/trainers/all", { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => api.get("/trainers"));
      setTrainers(res.data.trainers || []);
    } catch { setMsg({ type: "error", text: "Failed to load trainers." }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const review = async (id, status) => {
    setActioning(id); setMsg({ type: "", text: "" });
    try {
      await api.patch(`/trainers/${id}/review`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: "success", text: `Trainer ${status} successfully.` });
      load();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Action failed." });
    } finally { setActioning(null); }
  };

  const filtered = trainers.filter(t => filter === "all" || t.verificationStatus === filter);
  const counts = {
    pending:  trainers.filter(t => t.verificationStatus === "pending").length,
    approved: trainers.filter(t => t.verificationStatus === "approved").length,
    rejected: trainers.filter(t => t.verificationStatus === "rejected").length,
  };

  return (
    <div className="card">
      <div className="flex-between mb-4">
        <h3 className="font-heading" style={{ fontSize: 22 }}>Trainer Applications</h3>
        <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
      </div>
      <FilterTabs filter={filter} setFilter={setFilter} counts={counts} />
      {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 160 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-text">No {filter === "all" ? "" : filter} applications.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(t => (
            <div key={t._id} style={{
              background: "var(--bg3)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: 16,
              display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <div className="trainer-avatar" style={{ width: 36, height: 36, fontSize: 15, borderRadius: 10 }}>
                    {(t.user?.name || "T")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.user?.name || "Unknown"}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>{t.user?.email}</div>
                  </div>
                  <StatusBadge status={t.verificationStatus} />
                </div>
                {t.bio && <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 6 }}>{t.bio}</p>}
                {t.certificateUrl ? (
                  <a href={`${BASE_URL}${t.certificateUrl}`} target="_blank" rel="noreferrer"
                    style={{ color: "var(--accent2)", fontSize: 12, textDecoration: "none" }}>
                    📎 View Certificate
                  </a>
                ) : (
                  <span style={{ color: "var(--text3)", fontSize: 12 }}>No certificate uploaded</span>
                )}
              </div>
              {t.verificationStatus === "pending" && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-success btn-sm" onClick={() => review(t._id, "approved")} disabled={actioning === t._id}>✓ Approve</button>
                  <button className="btn btn-danger btn-sm"  onClick={() => review(t._id, "rejected")} disabled={actioning === t._id}>✕ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Vendor section ─────────────────────────────────────────────────────────────
function VendorReview({ token }) {
  const [vendors, setVendors] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [actioning, setActioning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState({});   // vendorId → reason string
  const [showReject, setShowReject] = useState(null);      // vendorId showing reject input

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendors/all", { headers: { Authorization: `Bearer ${token}` } });
      setVendors(res.data.vendors || []);
    } catch { setMsg({ type: "error", text: "Failed to load vendors." }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const review = async (id, status) => {
    setActioning(id); setMsg({ type: "", text: "" });
    try {
      await api.patch(`/vendors/${id}/review`,
        { status, rejectionReason: rejectReason[id] || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg({ type: "success", text: `Vendor ${status} successfully.` });
      setShowReject(null);
      load();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Action failed." });
    } finally { setActioning(null); }
  };

  const filtered = vendors.filter(v => filter === "all" || v.verificationStatus === filter);
  const counts = {
    pending:  vendors.filter(v => v.verificationStatus === "pending").length,
    approved: vendors.filter(v => v.verificationStatus === "approved").length,
    rejected: vendors.filter(v => v.verificationStatus === "rejected").length,
  };

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="flex-between mb-4">
        <h3 className="font-heading" style={{ fontSize: 22 }}>Vendor Applications</h3>
        <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
      </div>
      <FilterTabs filter={filter} setFilter={setFilter} counts={counts} />
      {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 160 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏪</div>
          <div className="empty-state-text">No {filter === "all" ? "" : filter} vendor applications.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(v => (
            <div key={v._id} style={{
              background: "var(--bg3)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: 16, gap: 16,
            }}>
              {/* Top row — info + actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  {/* Identity */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <div className="trainer-avatar" style={{ width: 36, height: 36, fontSize: 15, borderRadius: 10 }}>
                      {(v.businessName || v.user?.name || "V")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{v.businessName || "Business name not set"}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>
                        {v.user?.name} · {v.user?.email}
                      </div>
                    </div>
                    <StatusBadge status={v.verificationStatus} />
                  </div>

                  {/* Business details */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
                    {v.businessType && (
                      <span style={{ fontSize: 12, color: "var(--text2)" }}>
                        🏷 {v.businessType.replace("_", " ")}
                      </span>
                    )}
                    {v.city && <span style={{ fontSize: 12, color: "var(--text2)" }}>📍 {v.city}</span>}
                    {v.phone && <span style={{ fontSize: 12, color: "var(--text2)" }}>📞 {v.phone}</span>}
                    {v.gstNumber && <span style={{ fontSize: 12, color: "var(--text2)" }}>🧾 GST: {v.gstNumber}</span>}
                  </div>

                  {v.description && (
                    <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 8 }}>{v.description}</p>
                  )}

                  {/* Certificate link — most important for admin */}
                  {v.certificateUrl ? (
                    <a href={`${BASE_URL}${v.certificateUrl}`} target="_blank" rel="noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        color: "var(--accent2)", fontSize: 13, fontWeight: 600,
                        textDecoration: "none", padding: "4px 12px",
                        background: "rgba(0,112,243,0.1)", borderRadius: 6,
                        border: "1px solid rgba(0,112,243,0.2)",
                      }}>
                      📄 View License / Certificate
                    </a>
                  ) : (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 12, color: "var(--text3)", padding: "4px 10px",
                      background: "var(--bg2)", borderRadius: 6, border: "1px solid var(--border)",
                    }}>
                      ⚠ No certificate uploaded yet
                    </span>
                  )}

                  {/* Rejection reason (if rejected) */}
                  {v.verificationStatus === "rejected" && v.rejectionReason && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--red)" }}>
                      Rejection reason: {v.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {v.verificationStatus === "pending" && (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-success btn-sm"
                      onClick={() => review(v._id, "approved")}
                      disabled={actioning === v._id}>
                      ✓ Approve
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => setShowReject(showReject === v._id ? null : v._id)}
                      disabled={actioning === v._id}>
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Rejection reason input — expands inline */}
              {showReject === v._id && (
                <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="form-input"
                    placeholder="Reason for rejection (shown to vendor)…"
                    value={rejectReason[v._id] || ""}
                    onChange={e => setRejectReason(r => ({ ...r, [v._id]: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-danger btn-sm"
                    onClick={() => review(v._id, "rejected")}
                    disabled={actioning === v._id}>
                    Confirm Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main AdminDashboard ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("trainers"); // "trainers" | "vendors"

  return (
    <>
      {/* Section switcher */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { key: "trainers", label: "💪 Trainer Reviews" },
          { key: "vendors",  label: "🏪 Vendor Reviews"  },
        ].map(({ key, label }) => (
          <button key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer",
              border: tab === key ? "2px solid var(--accent)" : "2px solid var(--border)",
              background: tab === key ? "rgba(0,112,243,0.1)" : "var(--bg2)",
              color: tab === key ? "var(--accent)" : "var(--text3)",
              transition: "all 0.15s",
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "trainers" && <TrainerReview token={token} />}
      {tab === "vendors"  && <VendorReview  token={token} />}
    </>
  );
}