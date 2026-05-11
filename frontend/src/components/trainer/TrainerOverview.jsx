import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";
import TrainerAnalytics from "./TrainerAnalytics.jsx"; // Ensure this path is correct

// Quick action card
function QuickAction({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "8px", padding: "16px 8px", background: "var(--surface)",
        border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
        cursor: "pointer", transition: "all 0.15s", width: "100%"
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.transform = "none"; }}
    >
      <span style={{ fontSize: "26px" }}>{icon}</span>
      <span style={{ fontSize: "11px", fontWeight: 700, color, textAlign: "center" }}>{label}</span>
    </button>
  );
}

export default function TrainerOverview({ onNavigate }) {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("overview"); // Toggle state

  useEffect(() => {
    (async () => {
      try {
        const [overviewRes, clientsRes] = await Promise.all([
          api.get("/trainers/overview", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/trainers/clients", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setData(overviewRes.data);
        setClients(clientsRes.data.clients || []);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="card loading-screen"><div className="spinner"></div></div>;

  const nav = onNavigate || (() => {});
  const verColor = data?.verificationStatus === "approved" ? "var(--green)" : "var(--gold)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      
      {/* ── Sub-Tab Navigation ── */}
      <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>
        <button 
          onClick={() => setActiveSubTab("overview")}
          style={{
            background: "none", border: "none", paddingBottom: "12px", cursor: "pointer",
            fontSize: "14px", fontWeight: 700, color: activeSubTab === "overview" ? "var(--accent)" : "var(--text3)",
            borderBottom: activeSubTab === "overview" ? "2px solid var(--accent)" : "2px solid transparent",
            transition: "all 0.2s"
          }}
        >
          🏠 Command Center
        </button>
        <button 
          onClick={() => setActiveSubTab("analytics")}
          style={{
            background: "none", border: "none", paddingBottom: "12px", cursor: "pointer",
            fontSize: "14px", fontWeight: 700, color: activeSubTab === "analytics" ? "var(--accent)" : "var(--text3)",
            borderBottom: activeSubTab === "analytics" ? "2px solid var(--accent)" : "2px solid transparent",
            transition: "all 0.2s"
          }}
        >
          📈 Performance Hub
        </button>
      </div>

      {activeSubTab === "analytics" ? (
        <TrainerAnalytics />
      ) : (
        <>
          {/* ── Hero Banner ── */}
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(0,112,243,0.08))",
            border: "1px solid rgba(124,58,237,0.2)", borderRadius: "24px",
            padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%"
          }}>
            <div>
              <div style={{ fontSize: "14px", color: "var(--text3)", marginBottom: "4px" }}>Welcome back, coach</div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0 }}>{user?.name}</h1>
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <span className="badge-pill" style={{ background: verColor + "22", color: verColor }}>
                  {data?.verificationStatus === "approved" ? "✓ Verified" : "⏳ Pending"}
                </span>
                <span className="badge-pill" style={{ background: "rgba(0,112,243,0.12)", color: "var(--accent)" }}>
                  💎 {clients.length} Active Clients
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "36px", color: "var(--green)", lineHeight: 1 }}>
                ₹{(data?.totalRevenue || 0).toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text3)" }}>total revenue</div>
            </div>
          </div>

          {/* ── Quick Actions Grid ── */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
              Quick Actions
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
              <QuickAction icon="📋" label="Programs" color="var(--accent)" onClick={() => nav("manage")} />
              <QuickAction icon="➕" label="Create New" color="var(--accent2)" onClick={() => nav("builder")} />
              <QuickAction icon="⭐" label="Recommend" color="var(--gold)" onClick={() => nav("recommendations")} />
              <QuickAction icon="🥗" label="Diet Plans" color="var(--green)" onClick={() => nav("dietplan")} />
              <QuickAction icon="📸" label="Client Proofs" color="#8b5cf6" onClick={() => nav("clientproofs")} />
              <QuickAction icon="🎥" label="Sessions" color="#ef4444" onClick={() => nav("sessions")} />
            </div>
          </div>

          {/* ── Main Content Grid ── */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", 
            gap: "24px",
            width: "100%" 
          }}>
            
            {/* Active Clients List Hub */}
            <div className="card" style={{ padding: "24px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3 style={{ margin: 0 }}>💎 Active Clients</h3>
                <button onClick={() => nav("clients")} className="text-link" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontWeight: 700 }}>
                  Full List →
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {clients.length === 0 ? (
                  <p style={{ color: "var(--text3)", textAlign: "center", padding: "20px" }}>No active clients currently enrolled.</p>
                ) : clients.slice(0, 5).map(c => (
                  <div key={c._id} style={{ 
                    background: "var(--bg3)", padding: "14px 18px", borderRadius: "14px",
                    display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border)"
                  }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                        {c.name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "14px" }}>{c.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text3)" }}>{c.goalType || "Muscle Gain"} · {c.currentWeight}kg</div>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() => nav("messages")} style={{ padding: "6px 12px", fontSize: "11px" }}>Chat</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="card" style={{ padding: "24px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ margin: 0 }}>📊 Performance</h3>
                <button onClick={() => setActiveSubTab("analytics")} className="text-link" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontWeight: 700 }}>
                  Full Analytics →
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                    <span style={{ fontSize: "14px", color: "var(--text2)" }}>Monthly Completions</span>
                    <span style={{ fontWeight: 800, color: "var(--green)", fontSize: "18px" }}>{data?.monthlyCompletions || 0}</span>
                 </div>
                 <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                    <span style={{ fontSize: "14px", color: "var(--text2)" }}>Average Rating</span>
                    <span style={{ fontWeight: 800, color: "var(--gold)", fontSize: "18px" }}>⭐ {Number(data?.avgRating || 0).toFixed(1)}</span>
                 </div>
              </div>
              
              {/* Revenue Progress Visual */}
              <div style={{ marginTop: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span style={{ color: "var(--text2)" }}>Revenue Progress</span>
                  <span style={{ fontWeight: 700, color: "var(--green)" }}>Goal: ₹1,00,000</span>
                </div>
                <div style={{ height: "8px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: data?.totalRevenue > 0 ? `${Math.min(100, (data.totalRevenue / 100000) * 100)}%` : "0%",
                    background: "linear-gradient(90deg, var(--green), var(--accent))",
                    transition: "width 0.8s ease-out"
                  }} />
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}