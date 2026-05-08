import { useEffect, useState, useCallback } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const RANK_ICONS  = { 1:"🥇", 2:"🥈", 3:"🥉" };
const RANK_COLORS = { 1:"#FFD700", 2:"#C0C0C0", 3:"#CD7F32" };

const POINT_TIPS = [
  "Complete a daily workout → +10 pts",
  "Log your body weight → +5 pts",
  "Enroll in a program → +20 pts",
  "Rate a trainer → +5 pts",
];

function RankBadge({ rank }) {
  if (rank <= 3) return (
    <span style={{ fontSize:"20px", width:"32px", textAlign:"center", display:"inline-block" }}>
      {RANK_ICONS[rank]}
    </span>
  );
  return (
    <span style={{
      width:"32px", height:"32px", borderRadius:"50%",
      background:"var(--surface2)", border:"1px solid var(--border)",
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      fontSize:"12px", fontWeight:700, color:"var(--text3)", flexShrink:0,
    }}>
      {rank}
    </span>
  );
}

function PointsBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height:"3px", background:"var(--border)", borderRadius:"2px", marginTop:"4px", width:"100%" }}>
      <div style={{
        height:"100%", width:`${pct}%`,
        background:"linear-gradient(90deg,var(--accent2),var(--accent))",
        borderRadius:"2px", transition:"width 0.6s ease",
      }}/>
    </div>
  );
}

export default function Leaderboard() {
  const { token, user } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/leaderboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
      setLastRefresh(new Date());
    } catch {} finally { setLoading(false); }
  }, [token]);

  // Fetch on mount and every 5 minutes
  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetch]);

  const maxPoints = data?.leaderboard?.[0]?.lifetimePoints || 1;
  const cu        = data?.currentUser;

  return (
    <div className="card" style={{ display:"flex", flexDirection:"column", gap:"0" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", letterSpacing:"1.5px", color:"var(--text)" }}>
            🏆 LEADERBOARD
          </div>
          {lastRefresh && (
            <div style={{ fontSize:"10px", color:"var(--text3)", marginTop:"1px" }}>
              Updated {lastRefresh.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
            </div>
          )}
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={fetch}
          disabled={loading}
          style={{ fontSize:"12px", padding:"5px 12px" }}
        >
          {loading ? <span className="spinner" style={{width:"12px",height:"12px"}}></span> : "↻ Refresh"}
        </button>
      </div>

      {/* Your points summary */}
      {cu && (
        <div style={{
          background:"linear-gradient(135deg,rgba(0,112,243,0.1),rgba(124,58,237,0.08))",
          border:"1px solid rgba(0,112,243,0.2)", borderRadius:"var(--radius)",
          padding:"12px 14px", marginBottom:"14px",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:"12px", color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Your Rank</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px", color:"var(--accent)", lineHeight:1 }}>
                #{cu.rank}
                {cu.rank <= 3 && <span style={{ marginLeft:"6px" }}>{RANK_ICONS[cu.rank]}</span>}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"var(--gold)", lineHeight:1 }}>
                {(cu.lifetimePoints || 0).toLocaleString()}
              </div>
              <div style={{ fontSize:"11px", color:"var(--text3)" }}>lifetime FlexPoints</div>
            </div>
          </div>
          <PointsBar value={cu.lifetimePoints || 0} max={maxPoints} />
        </div>
      )}

      {/* Top 10 list */}
      {loading && !data ? (
        <div className="loading-screen" style={{ minHeight:"180px" }}>
          <div className="spinner"></div>
        </div>
      ) : !data?.leaderboard?.length ? (
        <div className="empty-state" style={{ padding:"24px" }}>
          <div className="empty-state-icon">🏆</div>
          <div className="empty-state-text">
            No rankings yet. Complete workouts to earn FlexPoints and appear here!
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {data.leaderboard.map((entry) => (
            <div
              key={entry.rank}
              style={{
                display:"flex", alignItems:"center", gap:"10px",
                padding:"10px 12px", borderRadius:"var(--radius)",
                background: entry.isCurrentUser ? "rgba(0,112,243,0.08)" : "var(--bg3)",
                border: `1px solid ${entry.isCurrentUser ? "var(--accent2)" : "var(--border)"}`,
                transition:"background 0.15s",
              }}
            >
              <RankBadge rank={entry.rank} />

              {/* Avatar */}
              <div style={{
                width:"32px", height:"32px", borderRadius:"10px", flexShrink:0,
                background: entry.rank <= 3
                  ? `linear-gradient(135deg,${RANK_COLORS[entry.rank]}33,${RANK_COLORS[entry.rank]}11)`
                  : "var(--surface2)",
                border: `1px solid ${entry.rank <= 3 ? RANK_COLORS[entry.rank]+"44" : "var(--border)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"14px", fontWeight:700,
                color: entry.rank <= 3 ? RANK_COLORS[entry.rank] : "var(--text2)",
              }}>
                {entry.avatar}
              </div>

              {/* Name + role */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <span style={{
                    fontWeight: entry.isCurrentUser ? 700 : 600,
                    fontSize:"13px",
                    color: entry.isCurrentUser ? "var(--accent2)" : "var(--text)",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>
                    {entry.name}
                  </span>
                  {entry.isCurrentUser && (
                    <span style={{ fontSize:"9px", background:"rgba(0,112,243,0.2)", color:"var(--accent2)", padding:"1px 5px", borderRadius:"4px", fontWeight:700, flexShrink:0 }}>YOU</span>
                  )}
                  {entry.role && (
                    <span className={`nav-badge ${entry.role === "trainer" ? "badge-trainer" : "badge-client"}`} style={{ fontSize:"9px" }}>
                      {entry.role}
                    </span>
                  )}
                </div>
                <PointsBar value={entry.lifetimePoints} max={maxPoints} />
              </div>

              {/* Points */}
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{
                  fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px",
                  color: entry.rank <= 3 ? RANK_COLORS[entry.rank] : "var(--text2)",
                  lineHeight:1,
                }}>
                  {(entry.lifetimePoints || 0).toLocaleString()}
                </div>
                <div style={{ fontSize:"9px", color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.3px" }}>pts</div>
              </div>
            </div>
          ))}

          {/* Show current user below if not in top 10 */}
          {cu && !cu.inTop10 && (
            <>
              <div style={{ textAlign:"center", padding:"4px 0", color:"var(--text3)", fontSize:"11px" }}>• • •</div>
              <div style={{
                display:"flex", alignItems:"center", gap:"10px",
                padding:"10px 12px", borderRadius:"var(--radius)",
                background:"rgba(0,112,243,0.08)", border:"1px solid var(--accent2)",
              }}>
                <RankBadge rank={cu.rank} />
                <div style={{ width:"32px", height:"32px", borderRadius:"10px", background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:700, flexShrink:0 }}>
                  {cu.avatar}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                    <span style={{ fontWeight:700, fontSize:"13px", color:"var(--accent2)" }}>{cu.name}</span>
                    <span style={{ fontSize:"9px", background:"rgba(0,112,243,0.2)", color:"var(--accent2)", padding:"1px 5px", borderRadius:"4px", fontWeight:700 }}>YOU</span>
                  </div>
                  <PointsBar value={cu.lifetimePoints} max={maxPoints} />
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"var(--text2)", lineHeight:1 }}>
                    {(cu.lifetimePoints || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize:"9px", color:"var(--text3)", textTransform:"uppercase" }}>pts</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* How to earn points */}
      <div style={{ marginTop:"14px", padding:"12px", background:"var(--bg3)", borderRadius:"var(--radius)", border:"1px solid var(--border)" }}>
        <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"8px" }}>
          💡 How to Earn FlexPoints
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px" }}>
          {POINT_TIPS.map(tip => (
            <div key={tip} style={{ fontSize:"11px", color:"var(--text2)", display:"flex", gap:"4px" }}>
              <span style={{ color:"var(--green)", flexShrink:0 }}>✓</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
