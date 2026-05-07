import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const MILESTONE_CONFIG = {
  "10_workouts":  { icon:"🏅", label:"10 Workouts"    },
  "25_workouts":  { icon:"🥈", label:"25 Workouts"    },
  "50_workouts":  { icon:"🥇", label:"50 Workouts"    },
  "100_workouts": { icon:"🏆", label:"Century Club"   },
};

const TIER_CONFIG = [
  { min:0,    max:499,  name:"Bronze",   icon:"🥉", color:"#cd7f32", perks:"10pts/workout, 1pt/₹10" },
  { min:500,  max:1499, name:"Silver",   icon:"🥈", color:"#c0c0c0", perks:"+5% bonus on all points" },
  { min:1500, max:3999, name:"Gold",     icon:"🥇", color:"#ffd700", perks:"+10% bonus, priority support" },
  { min:4000, max:Infinity, name:"Platinum", icon:"💎", color:"#00d4ff", perks:"+20% bonus, exclusive deals" },
];

function getTier(lifetimePoints) {
  return TIER_CONFIG.find(t => lifetimePoints >= t.min && lifetimePoints <= t.max) || TIER_CONFIG[0];
}

export default function MyRewards() {
  const { token } = useAuth();
  const [points, setPoints]   = useState({ flexPoints:0, lifetimePoints:0 });
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/rewards/points",  { headers:{ Authorization:`Bearer ${token}` } }),
      api.get("/rewards/coupons", { headers:{ Authorization:`Bearer ${token}` } }),
    ]).then(([pRes, cRes]) => {
      setPoints(pRes.data);
      setCoupons(cRes.data.coupons || []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [token]);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  if (loading) return <div className="card loading-screen" style={{minHeight:"200px"}}><div className="spinner"/></div>;

  const tier     = getTier(points.lifetimePoints);
  const nextTier = TIER_CONFIG[TIER_CONFIG.indexOf(tier) + 1];
  const tierPct  = nextTier
    ? Math.round(((points.lifetimePoints - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  const activeCoupons  = coupons.filter(c => !c.isUsed && new Date(c.expiryDate) > new Date());
  const expiredCoupons = coupons.filter(c => c.isUsed || new Date(c.expiryDate) <= new Date());

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* Points + Tier Hero */}
      <div style={{ background:"linear-gradient(135deg, rgba(245,158,11,0.15), rgba(0,112,243,0.08))",
        border:`1px solid ${tier.color}44`, borderRadius:"var(--radius)", padding:"24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"16px" }}>
          <div>
            <div style={{ fontSize:"13px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase",
              letterSpacing:"0.5px", marginBottom:"6px" }}>Your FlexPoints</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"56px", color:"var(--gold)",
              lineHeight:1 }}>{points.flexPoints.toLocaleString()}</div>
            <div style={{ fontSize:"13px", color:"var(--text3)", marginTop:"4px" }}>
              {points.lifetimePoints.toLocaleString()} lifetime points
            </div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"48px", lineHeight:1, marginBottom:"6px" }}>{tier.icon}</div>
            <div style={{ fontWeight:800, fontSize:"18px", color:tier.color }}>{tier.name}</div>
            <div style={{ fontSize:"11px", color:"var(--text3)" }}>Member Tier</div>
          </div>
        </div>

        {/* Tier progress */}
        {nextTier && (
          <div style={{ marginTop:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px",
              color:"var(--text3)", marginBottom:"6px" }}>
              <span>{tier.icon} {tier.name}</span>
              <span>{nextTier.min - points.lifetimePoints} pts to {nextTier.icon} {nextTier.name}</span>
            </div>
            <div style={{ height:"8px", background:"var(--border)", borderRadius:"4px" }}>
              <div style={{ height:"100%", width:`${tierPct}%`, borderRadius:"4px",
                background:`linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                transition:"width 0.5s" }} />
            </div>
            <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"6px" }}>
              {nextTier.name} perks: {nextTier.perks}
            </div>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="card">
        <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"14px" }}>⚡ How to Earn Points</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {[
            { icon:"🏋️", action:"Log a Workout",        pts:"+10 pts" },
            { icon:"📦", action:"Order Delivered (₹10)", pts:"+1 pt"   },
            { icon:"🔥", action:"7-Day Streak Bonus",    pts:"+50 pts" },
            { icon:"🎯", action:"Complete a Program",    pts:"+100 pts"},
          ].map(e => (
            <div key={e.action} style={{ display:"flex", alignItems:"center", gap:"12px",
              padding:"12px", background:"var(--bg3)", borderRadius:"10px",
              border:"1px solid var(--border)" }}>
              <span style={{ fontSize:"22px" }}>{e.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"13px", fontWeight:600 }}>{e.action}</div>
                <div style={{ fontSize:"12px", color:"var(--gold)", fontWeight:700 }}>{e.pts}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Coupons */}
      <div className="card">
        <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"6px" }}>🎟 My Reward Coupons</div>
        <div style={{ fontSize:"13px", color:"var(--text3)", marginBottom:"16px" }}>
          Earned automatically when you hit workout milestones. Apply at checkout.
        </div>

        {activeCoupons.length === 0 && expiredCoupons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎟</div>
            <div className="empty-state-text">No coupons yet</div>
            <div style={{ fontSize:"13px", color:"var(--text3)", marginTop:"6px" }}>
              Log 10 workouts to unlock your first discount coupon!
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {activeCoupons.map(c => {
              const cfg = MILESTONE_CONFIG[c.milestone] || { icon:"🎟", label:"Milestone" };
              const daysLeft = Math.ceil((new Date(c.expiryDate) - new Date()) / 86400000);
              return (
                <div key={c._id} style={{ display:"flex", alignItems:"center", gap:"14px",
                  padding:"16px", background:"rgba(16,185,129,0.06)",
                  border:"1px solid rgba(16,185,129,0.25)", borderRadius:"12px" }}>
                  <div style={{ fontSize:"32px" }}>{cfg.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:"20px", color:"var(--green)" }}>
                      {c.discountPercentage}% OFF
                    </div>
                    <div style={{ fontSize:"12px", color:"var(--text2)" }}>{cfg.label} Reward</div>
                    <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
                      Expires in {daysLeft} day{daysLeft!==1?"s":""}
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"monospace", fontWeight:800, fontSize:"15px",
                      background:"var(--bg3)", border:"1px dashed var(--border)",
                      padding:"6px 12px", borderRadius:"8px", marginBottom:"6px",
                      color:"var(--text)", letterSpacing:"1px" }}>
                      {c.code}
                    </div>
                    <button className="btn btn-success btn-sm" onClick={() => copyCode(c.code)}>
                      {copied === c.code ? "✓ Copied!" : "Copy Code"}
                    </button>
                  </div>
                </div>
              );
            })}

            {expiredCoupons.length > 0 && (
              <>
                <div style={{ fontSize:"12px", color:"var(--text3)", fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.5px", marginTop:"8px" }}>
                  Used / Expired
                </div>
                {expiredCoupons.map(c => (
                  <div key={c._id} style={{ display:"flex", alignItems:"center", gap:"14px",
                    padding:"12px 16px", background:"var(--bg3)", opacity:0.5,
                    border:"1px solid var(--border)", borderRadius:"12px" }}>
                    <span style={{ fontSize:"24px" }}>🎟</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700 }}>{c.discountPercentage}% OFF — {c.code}</div>
                      <div style={{ fontSize:"11px", color:"var(--text3)" }}>
                        {c.isUsed ? "Used" : "Expired"}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}