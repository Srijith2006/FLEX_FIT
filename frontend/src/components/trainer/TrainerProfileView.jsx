import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const SPECIALIZATIONS = [
  "Weight Loss","Muscle Gain","HIIT","Yoga","Powerlifting","Cardio",
  "Nutrition","Rehabilitation","Sports Performance","Flexibility",
  "Women's Fitness","Senior Fitness","Crossfit","Boxing","Swimming",
];

const TRAINING_STYLES = ["Online Only","In-Person Only","Online + In-Person","Group Sessions"];
const LANGUAGES      = ["English","Hindi","Tamil","Telugu","Malayalam","Kannada","Bengali","Marathi"];

function InfoRow({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
      <span style={{ fontSize:"13px", color:"var(--text2)", flexShrink:0, marginRight:"16px" }}>{label}</span>
      <span style={{ fontSize:"14px", fontWeight:600, color: value ? "var(--text)" : "var(--text3)",
        textAlign:"right", maxWidth:"65%" }}>
        {value || "Not set"}
      </span>
    </div>
  );
}

export default function TrainerProfileView() {
  const { token, user } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [form, setForm] = useState({
    bio:"", specialization:[], yearsOfExperience:"", hourlyRate:"", monthlyRate:"",
    city:"", country:"", phone:"", instagram:"", website:"",
    certifications:"", languages:[], fitnessNiche:"", trainingStyle:"",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type:"", text:"" });

  const load = async () => {
    try {
      const res = await api.get("/trainers/profile/me", { headers:{ Authorization:`Bearer ${token}` } });
      const t = res.data.trainer;
      setTrainer(t);
      setForm({
        bio:               t.bio || "",
        specialization:    t.specialization || [],
        yearsOfExperience: t.yearsOfExperience || "",
        hourlyRate:        t.hourlyRate || "",
        monthlyRate:       t.monthlyRate || "",
        city:              t.city || "",
        country:           t.country || "",
        phone:             t.phone || "",
        instagram:         t.instagram || "",
        website:           t.website || "",
        certifications:    (t.certifications || []).join(", "),
        languages:         t.languages || [],
        fitnessNiche:      t.fitnessNiche || "",
        trainingStyle:     t.trainingStyle || "",
      });
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const toggleSpec = (s) => setForm(f => ({
    ...f, specialization: f.specialization.includes(s)
      ? f.specialization.filter(x => x !== s)
      : [...f.specialization, s],
  }));

  const toggleLang = (l) => setForm(f => ({
    ...f, languages: f.languages.includes(l)
      ? f.languages.filter(x => x !== l)
      : [...f.languages, l],
  }));

  const save = async () => {
    setSaving(true); setMsg({ type:"", text:"" });
    try {
      const res = await api.put("/trainers/profile", {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience)||0,
        hourlyRate:        Number(form.hourlyRate)||0,
        monthlyRate:       Number(form.monthlyRate)||0,
        certifications:    form.certifications.split(",").map(s=>s.trim()).filter(Boolean),
      }, { headers:{ Authorization:`Bearer ${token}` } });
      setTrainer(res.data.trainer);
      setEditing(false);
      setMsg({ type:"success", text:"Profile saved successfully!" });
    } catch(e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Save failed." });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="card loading-screen" style={{minHeight:"200px"}}><div className="spinner"></div></div>;

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  if (!editing) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      {msg.text && <div className={`alert alert-${msg.type==="error"?"error":"success"}`}>{msg.text}</div>}

      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
          <div style={{ display:"flex", gap:"16px", alignItems:"center" }}>
            <div style={{
              width:"72px", height:"72px", borderRadius:"20px", flexShrink:0,
              background:"linear-gradient(135deg,var(--accent3),var(--accent2))",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#fff",
            }}>
              {user?.name?.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)||"T"}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:"20px" }}>{user?.name}</div>
              <div style={{ color:"var(--text3)", fontSize:"13px", marginBottom:"6px" }}>{user?.email}</div>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center" }}>
                <span className="nav-badge badge-trainer">Trainer</span>
                {trainer?.verificationStatus === "approved" && (
                  <span className="tag tag-approved">✓ Verified</span>
                )}
                {trainer?.fitnessNiche && (
                  <span style={{ fontSize:"13px", color:"var(--text2)" }}>{trainer.fitnessNiche}</span>
                )}
              </div>
            </div>
          </div>
          <button className="btn btn-accent btn-sm" onClick={() => setEditing(true)}>✏️ Manage Profile</button>
        </div>

        {/* Stats pills */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:"10px", marginBottom:"20px" }}>
          {[
            { label:"Experience", value: trainer?.yearsOfExperience ? `${trainer.yearsOfExperience}y` : null },
            { label:"Rating",     value: trainer?.avgRating ? `★ ${Number(trainer.avgRating).toFixed(1)}` : null },
            { label:"Hourly",     value: trainer?.hourlyRate ? `₹${trainer.hourlyRate}/hr` : null },
            { label:"Monthly",    value: trainer?.monthlyRate ? `₹${trainer.monthlyRate}/mo` : null },
          ].filter(s=>s.value).map(s => (
            <div key={s.label} style={{ textAlign:"center", padding:"12px 8px",
              background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)" }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px",
                color:"var(--accent)", lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"10px", color:"var(--text3)", textTransform:"uppercase",
                letterSpacing:"0.5px", marginTop:"4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {trainer?.bio && (
          <div style={{ background:"var(--bg3)", borderRadius:"var(--radius)", padding:"14px",
            fontSize:"14px", color:"var(--text2)", lineHeight:"1.7", marginBottom:"16px" }}>
            {trainer.bio}
          </div>
        )}

        {trainer?.specialization?.length > 0 && (
          <div style={{ marginBottom:"14px" }}>
            <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase",
              letterSpacing:"0.8px", marginBottom:"8px" }}>Specializations</div>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {trainer.specialization.map(s => <span key={s} className="spec-tag">{s}</span>)}
            </div>
          </div>
        )}

        <InfoRow label="Training Style"  value={trainer?.trainingStyle} />
        <InfoRow label="Languages"       value={trainer?.languages?.join(", ")} />
        <InfoRow label="Certifications"  value={trainer?.certifications?.join(", ")} />
        <InfoRow label="Location"        value={trainer?.city && trainer?.country ? `${trainer.city}, ${trainer.country}` : trainer?.city || trainer?.country} />
        <InfoRow label="Instagram"       value={trainer?.instagram ? `@${trainer.instagram}` : null} />
        <InfoRow label="Website"         value={trainer?.website} />

        {(!trainer?.bio || !trainer?.specialization?.length) && (
          <div className="alert alert-info" style={{ marginTop:"16px" }}>
            👋 Your profile is incomplete — click <strong>Manage Profile</strong> to attract more clients.
          </div>
        )}
      </div>
    </div>
  );

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  return (
    <div className="card">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <h3 className="font-heading" style={{ fontSize:"22px" }}>Edit Trainer Profile</h3>
        <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type==="error"?"error":"success"} mb-4`}>{msg.text}</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:"22px" }}>

        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"12px" }}>About You</div>
          <div className="form-group" style={{ marginBottom:"12px" }}>
            <label className="form-label">Bio (sell yourself to clients)</label>
            <textarea className="form-textarea" rows="4"
              placeholder="Describe your coaching philosophy, approach, and what results clients can expect…"
              value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Fitness Niche</label>
            <input className="form-input" placeholder="e.g. Women's Fat Loss, Athlete Performance…"
              value={form.fitnessNiche} onChange={e=>setForm(f=>({...f,fitnessNiche:e.target.value}))} />
          </div>
        </section>

        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"12px" }}>Rates & Experience</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
            <div className="form-group">
              <label className="form-label">Experience (years)</label>
              <input className="form-input" type="number" min="0" placeholder="e.g. 5"
                value={form.yearsOfExperience} onChange={e=>setForm(f=>({...f,yearsOfExperience:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Hourly Rate (₹)</label>
              <input className="form-input" type="number" min="0" placeholder="e.g. 1500"
                value={form.hourlyRate} onChange={e=>setForm(f=>({...f,hourlyRate:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Rate (₹)</label>
              <input className="form-input" type="number" min="0" placeholder="e.g. 8000"
                value={form.monthlyRate} onChange={e=>setForm(f=>({...f,monthlyRate:e.target.value}))} />
            </div>
          </div>
        </section>

        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"12px" }}>Specializations</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {SPECIALIZATIONS.map(s => (
              <span key={s} onClick={()=>toggleSpec(s)} style={{
                padding:"5px 12px", borderRadius:"20px", cursor:"pointer", fontSize:"12px", fontWeight:600,
                border:`1px solid ${form.specialization.includes(s)?"var(--accent2)":"var(--border)"}`,
                background: form.specialization.includes(s)?"rgba(0,112,243,0.15)":"var(--bg3)",
                color: form.specialization.includes(s)?"var(--accent2)":"var(--text3)",
                transition:"all 0.15s",
              }}>{s}</span>
            ))}
          </div>
        </section>

        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"12px" }}>Training Style</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {TRAINING_STYLES.map(s => (
              <div key={s} onClick={()=>setForm(f=>({...f,trainingStyle:s}))} style={{
                border:`1px solid ${form.trainingStyle===s?"var(--accent2)":"var(--border)"}`,
                borderRadius:"var(--radius)", padding:"12px", cursor:"pointer", textAlign:"center",
                background:form.trainingStyle===s?"rgba(0,112,243,0.1)":"var(--bg3)",
                fontSize:"13px", fontWeight:600,
                color:form.trainingStyle===s?"var(--accent2)":"var(--text2)",
                transition:"all 0.15s",
              }}>{s}</div>
            ))}
          </div>
        </section>

        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"12px" }}>Languages</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {LANGUAGES.map(l => (
              <span key={l} onClick={()=>toggleLang(l)} style={{
                padding:"5px 12px", borderRadius:"20px", cursor:"pointer", fontSize:"12px", fontWeight:600,
                border:`1px solid ${form.languages.includes(l)?"var(--accent2)":"var(--border)"}`,
                background:form.languages.includes(l)?"rgba(0,112,243,0.15)":"var(--bg3)",
                color:form.languages.includes(l)?"var(--accent2)":"var(--text3)",
                transition:"all 0.15s",
              }}>{l}</span>
            ))}
          </div>
        </section>

        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"12px" }}>Certifications & Credentials</div>
          <div className="form-group">
            <label className="form-label">Certifications (comma separated)</label>
            <input className="form-input" placeholder="e.g. ACE CPT, NASM, CrossFit L1"
              value={form.certifications} onChange={e=>setForm(f=>({...f,certifications:e.target.value}))} />
          </div>
        </section>

        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"12px" }}>Location & Contact</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" placeholder="e.g. Mumbai" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-input" placeholder="e.g. India" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+91 9876543210" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Instagram Handle</label>
              <input className="form-input" placeholder="yourhandle (no @)" value={form.instagram} onChange={e=>setForm(f=>({...f,instagram:e.target.value}))} />
            </div>
            <div className="form-group" style={{ gridColumn:"span 2" }}>
              <label className="form-label">Website</label>
              <input className="form-input" placeholder="https://yourwebsite.com" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} />
            </div>
          </div>
        </section>

        <div style={{ display:"flex", gap:"10px" }}>
          <button className="btn btn-accent" style={{flex:1}} onClick={save} disabled={saving}>
            {saving ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Saving…</> : "✅ Update Profile"}
          </button>
          <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}