import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const TYPE_CONFIG = {
  workout:         { icon:"🏋️", label:"Workout",         color:"var(--accent)"  },
  meal:            { icon:"🥗",  label:"Meal",            color:"var(--green)"   },
  session_tracker: { icon:"📱",  label:"Session Tracker", color:"var(--accent2)" },
};

function fmt(secs) {
  if (!secs || secs <= 0) return null;
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function videoSrc(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5000"}${path}`;
}

// ── Lightbox ───────────────────────────────────────────────────────────────────
function Lightbox({ proof, onClose }) {
  if (!proof) return null;
  const cfg = TYPE_CONFIG[proof.type] || TYPE_CONFIG[proof.sessionType] || TYPE_CONFIG.workout;
  const isSessionTracker = proof.sessionType === "session_tracker" || proof.type === "session_tracker";
  const vSrc = videoSrc(proof.videoUrl);

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)",
      zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:"var(--bg2)", borderRadius:"16px", overflow:"hidden",
          maxWidth:"560px", width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }}>

        {/* Media — video player for session_tracker, image for others */}
        {isSessionTracker && vSrc ? (
          <video src={vSrc} controls style={{ width:"100%", maxHeight:"360px",
            background:"#000", display:"block" }} />
        ) : proof.imageUrl ? (
          <img src={proof.imageUrl} alt="proof"
            style={{ width:"100%", maxHeight:"420px", objectFit:"cover", display:"block" }} />
        ) : (
          <div style={{ height:"160px", background:"var(--bg3)", display:"flex",
            alignItems:"center", justifyContent:"center", fontSize:"48px" }}>
            {cfg.icon}
          </div>
        )}

        <div style={{ padding:"18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:"12px" }}>
            {/* Client avatar + name */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"50%",
                background:"var(--accent)", display:"flex", alignItems:"center",
                justifyContent:"center", fontWeight:700, fontSize:"13px", color:"#fff" }}>
                {(proof.clientName||"C")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:"14px" }}>{proof.clientName || "Client"}</div>
                <div style={{ fontSize:"11px", color:"var(--text3)" }}>
                  {new Date(proof.date).toLocaleDateString("en-IN",
                    {weekday:"long",day:"numeric",month:"long"})}
                </div>
              </div>
            </div>
            {/* Type badge */}
            <span style={{ fontSize:"12px", fontWeight:700, padding:"3px 10px",
              borderRadius:"20px", background:`${cfg.color}18`, color:cfg.color,
              border:`1px solid ${cfg.color}33` }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>

          {/* Session Tracker specifics */}
          {isSessionTracker && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
              gap:"10px", marginBottom:"14px" }}>
              <div style={{ padding:"10px 14px", background:"var(--bg3)",
                borderRadius:"10px", border:"1px solid var(--border)" }}>
                <div style={{ fontSize:"10px", color:"var(--text3)",
                  textTransform:"uppercase", fontWeight:700, marginBottom:"4px" }}>
                  ⏱ Duration
                </div>
                <div style={{ fontFamily:"'Courier New',monospace", fontWeight:700,
                  fontSize:"22px", color:"var(--gold)" }}>
                  {fmt(proof.duration) || "—"}
                </div>
              </div>
              <div style={{ padding:"10px 14px", background:"var(--bg3)",
                borderRadius:"10px", border:"1px solid var(--border)" }}>
                <div style={{ fontSize:"10px", color:"var(--text3)",
                  textTransform:"uppercase", fontWeight:700, marginBottom:"4px" }}>
                  🎬 Video
                </div>
                <div style={{ fontWeight:700, fontSize:"14px",
                  color: vSrc ? "var(--green)" : "var(--text3)" }}>
                  {vSrc ? "Uploaded ✓" : "None"}
                </div>
              </div>
            </div>
          )}

          {proof.caption && (
            <p style={{ fontSize:"13px", color:"var(--text2)", lineHeight:"1.6", marginBottom:"12px" }}>
              "{proof.caption}"
            </p>
          )}

          {/* External video link if not inline */}
          {!isSessionTracker && proof.videoUrl && (
            <a href={videoSrc(proof.videoUrl)} target="_blank" rel="noreferrer"
              className="btn btn-outline btn-sm" style={{ marginBottom:"10px" }}>
              🎬 View Video
            </a>
          )}

          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Proof Card ─────────────────────────────────────────────────────────────────
function ProofCard({ proof, onClick }) {
  const isSession = proof.sessionType === "session_tracker" || proof.type === "session_tracker";
  const cfg = TYPE_CONFIG[isSession ? "session_tracker" : proof.type] || TYPE_CONFIG.workout;
  const vSrc = videoSrc(proof.videoUrl);

  return (
    <div onClick={onClick}
      style={{ borderRadius:"12px", overflow:"hidden", background:"var(--bg3)",
        border:"1px solid var(--border)", cursor:"pointer",
        transition:"transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)";
        e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="none";
        e.currentTarget.style.boxShadow="none"; }}>

      {/* Thumbnail */}
      <div style={{ height:"160px", background:"var(--bg2)", position:"relative", overflow:"hidden" }}>
        {isSession && vSrc ? (
          /* Video thumbnail for session_tracker */
          <div style={{ width:"100%", height:"100%", background:"#111",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:"6px" }}>
            <div style={{ fontSize:"36px" }}>▶</div>
            <div style={{ fontSize:"11px", color:"var(--text3)" }}>Tap to play</div>
          </div>
        ) : proof.imageUrl ? (
          <img src={proof.imageUrl} alt="proof"
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => { e.target.style.display="none"; }} />
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex",
            alignItems:"center", justifyContent:"center", fontSize:"48px" }}>
            {cfg.icon}
          </div>
        )}

        {/* Type badge */}
        <div style={{ position:"absolute", top:"8px", left:"8px",
          background:`${cfg.color}ee`, borderRadius:"20px",
          padding:"3px 10px", fontSize:"11px", fontWeight:700, color:"#fff" }}>
          {cfg.icon} {cfg.label}
        </div>

        {/* Duration badge for session_tracker */}
        {isSession && proof.duration > 0 && (
          <div style={{ position:"absolute", bottom:"8px", right:"8px",
            background:"rgba(0,0,0,0.75)", borderRadius:"6px",
            padding:"3px 8px", fontSize:"12px", fontWeight:700,
            color:"var(--gold)", fontFamily:"'Courier New',monospace" }}>
            ⏱ {fmt(proof.duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"10px 12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"5px" }}>
          <div style={{ width:"24px", height:"24px", borderRadius:"50%",
            background:"var(--accent)", display:"flex", alignItems:"center",
            justifyContent:"center", fontWeight:700, fontSize:"11px",
            color:"#fff", flexShrink:0 }}>
            {(proof.clientName||"C")[0].toUpperCase()}
          </div>
          <div style={{ fontWeight:700, fontSize:"13px", overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {proof.clientName || "Client"}
          </div>
        </div>
        {proof.caption && (
          <div style={{ fontSize:"12px", color:"var(--text2)", lineHeight:"1.4",
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
            overflow:"hidden" }}>
            {proof.caption}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ClientProofFeed() {
  const { token } = useAuth();
  const [proofs,        setProofs]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all");   // "all"|"workout"|"meal"|"session_tracker"
  const [clientFilter,  setClientFilter]  = useState("all");
  const [selected,      setSelected]      = useState(null);

  useEffect(() => {
    // Fetch both image proofs and session tracker submissions
    Promise.allSettled([
      api.get("/proof/trainer-feed",     { headers:{ Authorization:`Bearer ${token}` } }),
      api.get("/proof/session-tracker",  { headers:{ Authorization:`Bearer ${token}` } }),
    ]).then(([imgRes, sessRes]) => {
      const imgProofs  = imgRes.status  === "fulfilled" ? (imgRes.value.data.proofs  || []) : [];
      const sessProofs = sessRes.status === "fulfilled" ? (sessRes.value.data.proofs || []) : [];
      // Normalise session proofs to the same shape
      const normSess = sessProofs.map(p => ({
        ...p,
        type:        "session_tracker",
        sessionType: "session_tracker",
        date:        p.date || (p.createdAt ? p.createdAt.split("T")[0] : ""),
        clientName:  p.clientName || p.client?.user?.name || "Client",
      }));
      setProofs([...imgProofs, ...normSess]);
    }).finally(() => setLoading(false));
  }, [token]);

  const clients      = [...new Map(proofs.map(p => [p.clientName, p.clientName])).values()];
  const sessionCount = proofs.filter(p => p.sessionType === "session_tracker").length;

  const filtered = proofs.filter(p => {
    const typeOk   = filter === "all"
      ? true
      : filter === "session_tracker"
        ? p.sessionType === "session_tracker"
        : p.type === filter && p.sessionType !== "session_tracker";
    const clientOk = clientFilter === "all" || p.clientName === clientFilter;
    return typeOk && clientOk;
  });

  // Group by date
  const grouped     = filtered.reduce((acc, p) => {
    const key = p.date; if (!acc[key]) acc[key] = []; acc[key].push(p); return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

  if (loading) return (
    <div className="card loading-screen" style={{minHeight:"200px"}}><div className="spinner"/></div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* Header stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
        {[
          { icon:"📸", label:"Total Proofs",    value:proofs.length,                                color:"var(--accent)"  },
          { icon:"🏋️", label:"Workout Proofs", value:proofs.filter(p=>p.type==="workout"&&p.sessionType!=="session_tracker").length, color:"var(--accent2)" },
          { icon:"🥗", label:"Meal Proofs",     value:proofs.filter(p=>p.type==="meal").length,     color:"var(--green)"   },
          { icon:"📱", label:"Session Tracker", value:sessionCount,                                 color:"var(--gold)"    },
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
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {[
              { key:"all",             label:"All"              },
              { key:"workout",         label:"🏋️ Workout"      },
              { key:"meal",            label:"🥗 Meal"          },
              { key:"session_tracker", label:"📱 Session Tracker" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`btn btn-sm ${filter===f.key ? "btn-primary" : "btn-outline"}`}>
                {f.label}
              </button>
            ))}
          </div>
          {clients.length > 1 && (
            <select className="form-select" style={{ maxWidth:"180px", fontSize:"12px" }}
              value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
              <option value="all">All Clients</option>
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <span style={{ fontSize:"12px", color:"var(--text3)", marginLeft:"auto" }}>
            {filtered.length} submission{filtered.length!==1?"s":""}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📸</div>
            <div className="empty-state-text">No submissions yet.</div>
            <div style={{ fontSize:"13px", color:"var(--text3)", marginTop:"6px" }}>
              Your clients' workout photos and tracked sessions will appear here.
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

            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",
              gap:"12px", marginBottom:"8px" }}>
              {dayProofs.map((p, i) => (
                <ProofCard key={p._id||i} proof={p} onClick={() => setSelected(p)} />
              ))}
            </div>
          </div>
        );
      })}

      <Lightbox proof={selected} onClose={() => setSelected(null)} />
    </div>
  );
}