import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

export default function TrainerOverview() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/trainers/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div className="card loading-screen" style={{ minHeight: "200px" }}>
      <div className="spinner"></div>
    </div>
  );

  if (!stats) return null;

  const verificationColor = {
    approved: "var(--green)", pending: "var(--gold)", rejected: "var(--red)",
  }[stats.verificationStatus] || "var(--text3)";

  const verificationLabel = {
    approved: "✓ Verified Trainer",
    pending:  "⏳ Verification Pending",
    rejected: "✕ Verification Rejected",
  }[stats.verificationStatus] || "Not Submitted";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Verification banner */}
      <div style={{
        padding: "14px 18px",
        borderRadius: "var(--radius)",
        background: stats.verificationStatus === "approved"
          ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
        border: `1px solid ${verificationColor}33`,
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{ fontSize: "20px" }}>
          {stats.verificationStatus === "approved" ? "🏅" : stats.verificationStatus === "pending" ? "⏳" : "⚠️"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: verificationColor }}>{verificationLabel}</div>
          <div style={{ fontSize: "12px", color: "var(--text3)" }}>
            {stats.verificationStatus === "approved"
              ? "Your profile is live and visible to all clients."
              : stats.verificationStatus === "pending"
              ? "Admin is reviewing your certificate. Usually takes 24–48 hours."
              : "Your application was rejected. Please re-upload a valid certificate."}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-3">
        <div className="stat-card">
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>👥</div>
          <div className="stat-card-value" style={{ color: "var(--accent)" }}>
            {stats.totalEnrolled}
          </div>
          <div className="stat-card-label">total clients</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>⭐</div>
          <div className="stat-card-value" style={{ color: "var(--gold)" }}>
            {stats.totalRatings > 0 ? Number(stats.avgRating).toFixed(1) : "—"}
          </div>
          <div className="stat-card-label">{stats.totalRatings} ratings</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>💰</div>
          <div className="stat-card-value" style={{ color: "var(--green)" }}>
            ₹{stats.totalRevenue.toLocaleString()}
          </div>
          <div className="stat-card-label">total revenue</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Programs card */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}>📋 My Programs</div>
          {stats.recentPrograms?.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: "13px" }}>No programs yet. Create one!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {stats.recentPrograms.map(p => (
                <div key={p._id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", background: "var(--bg3)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius)",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{p.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--text3)" }}>
                      {p.enrolledCount} enrolled · ₹{p.price}
                    </div>
                  </div>
                  <span className={`tag ${p.isPublished ? "tag-approved" : "tag-pending"}`}>
                    {p.isPublished ? "Live" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity card */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}>📊 This Month</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text2)" }}>Workout Completions</span>
              <span style={{ fontWeight: 700, color: "var(--green)" }}>{stats.monthlyCompletions}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text2)" }}>Total Programs</span>
              <span style={{ fontWeight: 700 }}>{stats.totalPrograms}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text2)" }}>Avg Rating</span>
              <span style={{ fontWeight: 700, color: "var(--gold)" }}>
                {stats.totalRatings > 0 ? `★ ${Number(stats.avgRating).toFixed(1)}` : "No ratings yet"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}