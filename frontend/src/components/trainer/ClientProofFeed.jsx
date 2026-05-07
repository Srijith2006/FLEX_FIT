import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const TYPE_CONFIG = {
  workout: { icon:"🏋️", label:"Workout", color:"var(--accent)"  },
  meal:    { icon:"🥗",  label:"Meal",    color:"var(--green)"   },
};

// ── Lightbox ───────────────────────────────────────────────────────────────────
function Lightbox({ proof, onClose }) {
  if (!proof) return null;
  const cfg = TYPE_CONFIG[proof.type] || TYPE_CONFIG.workout;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)",
      zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:"var(--bg2)", borderRadius:"16px", overflow:"hidden",
          maxWidth:"520px", width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }}>
        <img src={proof.imageUrl} alt="proof"
          style={{ width:"100%", maxHeight:"420px", objectFit:"cover", display:"block" }} />
        <div style={{ padding:"18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"var(--accent)",
                display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
                fontSize:"13px", color:"#fff" }}>
                {(proof.clientName||"C")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:"14px" }}>{proof.clientName || "Client"}</div>
                <div style={{ fontSize:"11px", color:"var(--text3)" }}>
                  {new Date(proof.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
                </div>
              </div>
            </div>
            <span style={{ fontSize:"12px", fontWeight:700, padding:"3px 10px", borderRadius:"20px",
              background:`${cfg.color}18`, color:cfg.color, border:`1px solid ${cfg.color}33` }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          {proof.caption && (
            <p style={{ fontSize:"13px", color:"var(--text2)", lineHeight:"1.6", marginBottom:"12px" }}>
              "{proof.caption}"
            </p>
          )}
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ClientProofFeed() {
  const { token } = useAuth();
  const [proofs, setProofs]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");   // "all" | "workout" | "meal"
  const [clientFilter, setClientFilter] = useState("all");
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    api.get("/proof/trainer-feed", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => setProofs(r.data.proofs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Unique clients for filter dropdown
  const clients = [...new Map(proofs.map(p => [p.clientName, p.clientName])).values()];

  const filtered = proofs.filter(p => {
    const typeOk   = filter === "all"       || p.type === filter;
    const clientOk = clientFilter === "all" || p.clientName === clientFilter;
    return typeOk && clientOk;
  });

  // Group by date
  const grouped = filtered.reduce((acc, p) => {
    const key = p.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

  if (loading) return (
    <div className="card loading-screen" style={{minHeight:"200px"}}><div className="spinner"/></div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* Header stats */}
      <div className="grid-3">
        {[
          { icon:"📸", label:"Total Proofs",    value:proofs.length,                                  color:"var(--accent)"  },
          { icon:"🏋️", label:"Workout Proofs", value:proofs.filter(p=>p.type==="workout").length,    color:"var(--accent2)" },
          { icon:"🥗", label:"Meal Proofs",     value:proofs.filter(p=>p.type==="meal").length,       color:"var(--green)"   },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize:"22px", marginBottom:"8px" }}>{s.icon}</div>
            <div className="stat-card-value" style={{ color:s.color }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding:"14px 16px" }}>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"center" }}>
          {/* Type filter */}
          <div style={{ display:"flex", gap:"6px" }}>
            {["all","workout","meal"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter===f ? "btn-primary" : "btn-outline"}`}>
                {f==="all" ? "All" : f==="workout" ? "🏋️ Workout" : "🥗 Meal"}
              </button>
            ))}
          </div>

          {/* Client filter */}
          {clients.length > 1 && (
            <select className="form-select" style={{ maxWidth:"180px", fontSize:"12px" }}
              value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
              <option value="all">All Clients</option>
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <span style={{ fontSize:"12px", color:"var(--text3)", marginLeft:"auto" }}>
            {filtered.length} proof{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📸</div>
            <div className="empty-state-text">No proof submissions yet.</div>
            <div style={{ fontSize:"13px", color:"var(--text3)", marginTop:"6px" }}>
              Your clients' workout and meal photos will appear here once they start uploading.
            </div>
          </div>
        </div>
      )}

      {/* Grouped by date */}
      {sortedDates.map(date => {
        const dayProofs = grouped[date];
        const isToday   = date === new Date().toISOString().split("T")[0];
        const isYest    = date === new Date(Date.now()-86400000).toISOString().split("T")[0];
        const dateLabel = isToday ? "Today" : isYest ? "Yesterday"
          : new Date(date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});

        return (
          <div key={date}>
            {/* Date header */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
              <div style={{ fontWeight:700, fontSize:"13px", color:"var(--text2)",
                textTransform:"uppercase", letterSpacing:"0.5px" }}>
                {dateLabel}
              </div>
              <div style={{ flex:1, height:"1px", background:"var(--border)" }} />
              <span style={{ fontSize:"11px", color:"var(--text3)" }}>
                {dayProofs.length} submission{dayProofs.length!==1?"s":""}
              </span>
            </div>

            {/* Proof cards for this date */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"12px", marginBottom:"8px" }}>
              {dayProofs.map((p,i) => {
                const cfg = TYPE_CONFIG[p.type] || TYPE_CONFIG.workout;
                return (
                  <div key={i} onClick={() => setSelected(p)}
                    style={{ borderRadius:"12px", overflow:"hidden", background:"var(--bg3)",
                      border:"1px solid var(--border)", cursor:"pointer",
                      transition:"transform 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>

                    {/* Photo */}
                    <div style={{ height:"160px", background:"var(--bg2)", position:"relative", overflow:"hidden" }}>
                      <img src={p.imageUrl} alt="proof"
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        onError={e => { e.target.style.display="none"; }} />
                      {/* Type badge */}
                      <div style={{ position:"absolute", top:"8px", left:"8px",
                        background:`${cfg.color}ee`, borderRadius:"20px",
                        padding:"3px 10px", fontSize:"11px", fontWeight:700, color:"#fff" }}>
                        {cfg.icon} {cfg.label}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"5px" }}>
                        <div style={{ width:"24px", height:"24px", borderRadius:"50%",
                          background:"var(--accent)", display:"flex", alignItems:"center",
                          justifyContent:"center", fontWeight:700, fontSize:"11px", color:"#fff",
                          flexShrink:0 }}>
                          {(p.clientName||"C")[0].toUpperCase()}
                        </div>
                        <div style={{ fontWeight:700, fontSize:"13px", overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {p.clientName || "Client"}
                        </div>
                      </div>
                      {p.caption && (
                        <div style={{ fontSize:"12px", color:"var(--text2)", lineHeight:"1.4",
                          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                          overflow:"hidden" }}>
                          {p.caption}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Lightbox proof={selected} onClose={() => setSelected(null)} />
    </div>
  );
}