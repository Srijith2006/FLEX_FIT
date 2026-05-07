import { useEffect, useState, useRef } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const TYPE_CONFIG = {
  workout: { icon:"🏋️", label:"Workout",  color:"var(--accent)"  },
  meal:    { icon:"🥗", label:"Meal",     color:"var(--green)"   },
};

// ── Upload Card ────────────────────────────────────────────────────────────────
function UploadCard({ token, onUploaded }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [type, setType]       = useState("workout");
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState("");
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const submit = async () => {
    if (!file) { setError("Please select a photo first."); return; }
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("proof", file);
      fd.append("caption", caption);
      fd.append("type", type);
      fd.append("date", new Date().toISOString().split("T")[0]);
      await api.post("/proof/upload", fd, { headers: { Authorization: `Bearer ${token}` } });
      setFile(null); setPreview(""); setCaption(""); inputRef.current.value = "";
      onUploaded();
    } catch(e) {
      setError(e?.response?.data?.message || "Upload failed.");
    } finally { setUploading(false); }
  };

  return (
    <div className="card" style={{ border:"1px solid var(--accent2)44", background:"rgba(0,112,243,0.03)" }}>
      <div style={{ fontWeight:700, fontSize:"16px", marginBottom:"16px" }}>📸 Upload Today's Proof</div>

      {/* Type selector */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"16px" }}>
        {Object.entries(TYPE_CONFIG).map(([k, v]) => (
          <button key={k} onClick={() => setType(k)}
            style={{ flex:1, padding:"10px", borderRadius:"10px", cursor:"pointer", fontWeight:700,
              fontSize:"13px", border:`2px solid ${type===k ? v.color : "var(--border)"}`,
              background: type===k ? `${v.color}18` : "var(--bg3)",
              color: type===k ? v.color : "var(--text3)", transition:"all 0.15s" }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Image picker */}
      <label style={{ display:"block", cursor:"pointer", marginBottom:"12px" }}>
        <div style={{ borderRadius:"12px", overflow:"hidden", height:"220px",
          background:"var(--bg3)", border:`2px dashed ${preview ? "var(--accent)" : "var(--border)"}`,
          display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
          transition:"border-color 0.2s" }}>
          {preview ? (
            <img src={preview} alt="preview"
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <div style={{ textAlign:"center", color:"var(--text3)" }}>
              <div style={{ fontSize:"40px", marginBottom:"8px" }}>📷</div>
              <div style={{ fontSize:"13px", fontWeight:600 }}>Tap to choose photo</div>
              <div style={{ fontSize:"11px", marginTop:"4px" }}>JPG, PNG up to 10MB</div>
            </div>
          )}
          {preview && (
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center", opacity:0,
              transition:"opacity 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity=1}
              onMouseLeave={e => e.currentTarget.style.opacity=0}>
              <span style={{ color:"#fff", fontWeight:700, fontSize:"13px" }}>Change Photo</span>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
      </label>

      {/* Caption */}
      <div className="form-group" style={{ marginBottom:"14px" }}>
        <label className="form-label">Caption (optional)</label>
        <textarea className="form-textarea" rows="2"
          placeholder={type === "workout"
            ? "Crushed leg day! 🔥 Hit a new PR on squats…"
            : "High protein meal prep for the week! 💪"}
          value={caption} onChange={e => setCaption(e.target.value)} />
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom:"12px" }}>⚠ {error}</div>}

      <button className="btn btn-accent btn-full" onClick={submit} disabled={uploading || !file}>
        {uploading
          ? <><span className="spinner" style={{borderTopColor:"#fff",width:"14px",height:"14px"}}></span> Uploading…</>
          : `📤 Submit ${TYPE_CONFIG[type].label} Proof`}
      </button>
    </div>
  );
}

// ── Streak Banner ──────────────────────────────────────────────────────────────
function StreakBanner({ streak }) {
  const milestones = [3,7,14,30,60,100];
  const next = milestones.find(m => m > streak) || 100;
  const pct  = Math.min(100, Math.round((streak / next) * 100));

  const color = streak >= 30 ? "#f59e0b"
              : streak >= 14 ? "#10b981"
              : streak >= 7  ? "#0070f3"
              : "var(--text2)";

  return (
    <div className="card" style={{ background:`${color}10`, border:`1px solid ${color}33` }}>
      <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
        <div style={{ fontSize:"48px", lineHeight:1 }}>
          {streak >= 30 ? "🏆" : streak >= 14 ? "🔥" : streak >= 7 ? "⚡" : "✅"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:"24px", color, lineHeight:1 }}>
            {streak} Day Streak
          </div>
          <div style={{ fontSize:"13px", color:"var(--text2)", marginTop:"4px" }}>
            {streak === 0
              ? "Upload your first proof to start your streak!"
              : streak >= 30 ? "Legendary consistency! 🏆"
              : `${next - streak} more days to reach ${next}-day milestone`}
          </div>
          {streak > 0 && (
            <div style={{ marginTop:"8px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px",
                color:"var(--text3)", marginBottom:"4px" }}>
                <span>{streak} days</span>
                <span>{next} days</span>
              </div>
              <div style={{ height:"6px", background:"var(--border)", borderRadius:"3px" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:color,
                  borderRadius:"3px", transition:"width 0.5s" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Proof Grid ─────────────────────────────────────────────────────────────────
function ProofGrid({ proofs }) {
  const [selected, setSelected] = useState(null);

  if (proofs.length === 0) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">📸</div>
        <div className="empty-state-text">No proofs uploaded yet.</div>
        <div style={{ fontSize:"13px", color:"var(--text3)", marginTop:"6px" }}>
          Upload your first workout or meal photo to start tracking!
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="card">
        <div style={{ fontWeight:700, fontSize:"16px", marginBottom:"16px" }}>
          📅 My Proof History ({proofs.length})
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
          {proofs.map((p, i) => {
            const cfg = TYPE_CONFIG[p.type] || TYPE_CONFIG.workout;
            return (
              <div key={i} onClick={() => setSelected(p)}
                style={{ borderRadius:"10px", overflow:"hidden", aspectRatio:"1",
                  background:"var(--bg3)", cursor:"pointer", position:"relative",
                  border:"1px solid var(--border)", transition:"transform 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform="scale(1.03)"}
                onMouseLeave={e => e.currentTarget.style.transform="none"}>
                <img src={p.imageUrl} alt={p.caption || "proof"}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}
                  onError={e => { e.target.style.display="none"; }} />
                {/* Overlay */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0,
                  background:"linear-gradient(transparent,rgba(0,0,0,0.7))",
                  padding:"8px 6px 6px" }}>
                  <div style={{ fontSize:"9px", fontWeight:700, color:cfg.color,
                    textTransform:"uppercase" }}>{cfg.icon} {cfg.label}</div>
                  <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.7)", marginTop:"1px" }}>
                    {new Date(p.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:600,
            display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"var(--bg2)", borderRadius:"16px", overflow:"hidden",
              maxWidth:"500px", width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.6)" }}>
            <img src={selected.imageUrl} alt="proof"
              style={{ width:"100%", maxHeight:"400px", objectFit:"cover" }} />
            <div style={{ padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                <span style={{ fontSize:"12px", fontWeight:700,
                  color: TYPE_CONFIG[selected.type]?.color || "var(--accent)" }}>
                  {TYPE_CONFIG[selected.type]?.icon} {TYPE_CONFIG[selected.type]?.label}
                </span>
                <span style={{ fontSize:"12px", color:"var(--text3)" }}>
                  {new Date(selected.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
                </span>
              </div>
              {selected.caption && (
                <p style={{ fontSize:"14px", color:"var(--text2)", lineHeight:"1.5" }}>{selected.caption}</p>
              )}
              <button className="btn btn-outline btn-sm" style={{ marginTop:"12px" }}
                onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ProofOfWork() {
  const { token } = useAuth();
  const [proofs, setProofs]   = useState([]);
  const [streak, setStreak]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState("");

  const load = () => {
    api.get("/proof/mine", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => { setProofs(r.data.proofs || []); setStreak(r.data.streak || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const onUploaded = () => {
    setMsg("✅ Proof uploaded! Keep up the streak!");
    load();
    setTimeout(() => setMsg(""), 4000);
  };

  if (loading) return <div className="card loading-screen" style={{minHeight:"200px"}}><div className="spinner"/></div>;

  // Check if already uploaded today
  const today = new Date().toISOString().split("T")[0];
  const uploadedToday = proofs.filter(p => p.date === today);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {msg && (
        <div className="alert alert-success">
          {msg}
          <button onClick={() => setMsg("")} style={{background:"none",border:"none",marginLeft:"auto",cursor:"pointer",color:"inherit"}}>✕</button>
        </div>
      )}

      {/* Streak */}
      <StreakBanner streak={streak} />

      {/* Today status */}
      {uploadedToday.length > 0 && (
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          {uploadedToday.map((p,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 14px",
              borderRadius:"20px", background:`${TYPE_CONFIG[p.type]?.color}18`,
              border:`1px solid ${TYPE_CONFIG[p.type]?.color}44` }}>
              <span>{TYPE_CONFIG[p.type]?.icon}</span>
              <span style={{ fontSize:"12px", fontWeight:700, color:TYPE_CONFIG[p.type]?.color }}>
                {TYPE_CONFIG[p.type]?.label} proof uploaded today ✓
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", alignItems:"start" }}>
        <UploadCard token={token} onUploaded={onUploaded} />
        <ProofGrid proofs={proofs} />
      </div>
    </div>
  );
}