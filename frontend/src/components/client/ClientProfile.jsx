import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const GOAL_OPTIONS = [
  { value: "lose",        label: "Lose Weight",   icon: "🔥" },
  { value: "gain",        label: "Gain Muscle",   icon: "💪" },
  { value: "maintain",    label: "Maintain",      icon: "🎯" },
  { value: "endurance",   label: "Endurance",     icon: "🏃" },
  { value: "flexibility", label: "Flexibility",   icon: "🤸" },
];

const LEVEL_OPTIONS = [
  { value: "beginner",     label: "Beginner",     desc: "Just getting started"  },
  { value: "intermediate", label: "Intermediate", desc: "1–3 years experience"  },
  { value: "advanced",     label: "Advanced",     desc: "3+ years experience"   },
];

const GENDER_OPTIONS = [
  { value: "male",       label: "Male"              },
  { value: "female",     label: "Female"            },
  { value: "other",      label: "Other"             },
  { value: "prefer_not", label: "Prefer not to say" },
];

const empty = {
  age:"", gender:"prefer_not", height:"",
  currentWeight:"", targetWeight:"",
  goalType:"maintain", fitnessLevel:"beginner",
  workoutsPerWeek:3, healthNotes:"", injuries:"",
};

function InfoRow({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
      <span style={{ fontSize:"13px", color:"var(--text2)", flexShrink:0, marginRight:"16px" }}>{label}</span>
      <span style={{ fontSize:"14px", fontWeight:600, color: value ? "var(--text)" : "var(--text3)",
        textAlign:"right", maxWidth:"60%" }}>
        {value || "Not set"}
      </span>
    </div>
  );
}

export default function ClientProfile() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type:"", text:"" });

  const loadProfile = async () => {
    try {
      const res = await api.get("/clients/me", { headers: { Authorization:`Bearer ${token}` } });
      const c = res.data.client;
      setProfile(c);
      setForm({
        age: c.age||"", gender: c.gender||"prefer_not",
        height: c.height||"", currentWeight: c.currentWeight||"",
        targetWeight: c.targetWeight||"", goalType: c.goalType||"maintain",
        fitnessLevel: c.fitnessLevel||"beginner",
        workoutsPerWeek: c.workoutsPerWeek||3,
        healthNotes: c.healthNotes||"", injuries: c.injuries||"",
      });
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadProfile(); }, [token]);

  const save = async () => {
    setSaving(true); setMsg({ type:"", text:"" });
    try {
      const res = await api.put("/clients/me", {
        age: Number(form.age)||0, gender: form.gender,
        height: Number(form.height)||0,
        currentWeight: Number(form.currentWeight)||0,
        targetWeight: Number(form.targetWeight)||0,
        goalType: form.goalType, fitnessLevel: form.fitnessLevel,
        workoutsPerWeek: Number(form.workoutsPerWeek)||3,
        healthNotes: form.healthNotes, injuries: form.injuries,
      }, { headers: { Authorization:`Bearer ${token}` } });
      setProfile(res.data.client);
      setEditing(false);
      setMsg({ type:"success", text:"Profile saved successfully!" });
    } catch(e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Save failed." });
    } finally { setSaving(false); }
  };

  const cancelEdit = () => {
    if (profile) {
      setForm({
        age:profile.age||"", gender:profile.gender||"prefer_not",
        height:profile.height||"", currentWeight:profile.currentWeight||"",
        targetWeight:profile.targetWeight||"", goalType:profile.goalType||"maintain",
        fitnessLevel:profile.fitnessLevel||"beginner",
        workoutsPerWeek:profile.workoutsPerWeek||3,
        healthNotes:profile.healthNotes||"", injuries:profile.injuries||"",
      });
    }
    setEditing(false);
    setMsg({ type:"", text:"" });
  };

  if (loading) return (
    <div className="card loading-screen" style={{ minHeight:"200px" }}>
      <div className="spinner"></div>
    </div>
  );

  const goalObj   = GOAL_OPTIONS.find(g => g.value === (profile?.goalType||"maintain"));
  const levelObj  = LEVEL_OPTIONS.find(l => l.value === (profile?.fitnessLevel||"beginner"));
  const genderObj = GENDER_OPTIONS.find(g => g.value === (profile?.gender||"prefer_not"));
  const bmi = profile?.height && profile?.currentWeight
    ? (profile.currentWeight / Math.pow(profile.height/100, 2)).toFixed(1) : null;

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  if (!editing) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      {msg.text && <div className={`alert alert-${msg.type==="error"?"error":"success"}`}>{msg.text}</div>}

      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
          <div style={{ display:"flex", gap:"16px", alignItems:"center" }}>
            <div style={{
              width:"72px", height:"72px", borderRadius:"20px", flexShrink:0,
              background:"linear-gradient(135deg,var(--accent2),var(--accent3))",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#fff",
            }}>
              {user?.name?.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)||"?"}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:"20px" }}>{user?.name}</div>
              <div style={{ color:"var(--text3)", fontSize:"13px", marginBottom:"6px" }}>{user?.email}</div>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                <span className="nav-badge badge-client">Client</span>
                {levelObj && <span className="tag tag-active" style={{ textTransform:"capitalize" }}>{levelObj.label}</span>}
                {goalObj  && <span style={{ fontSize:"13px" }}>{goalObj.icon} {goalObj.label}</span>}
              </div>
            </div>
          </div>
          <button className="btn btn-accent btn-sm" onClick={() => setEditing(true)}>
            ✏️ Manage Profile
          </button>
        </div>

        {/* Quick stat pills */}
        {(profile?.currentWeight||profile?.height||profile?.age) && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))", gap:"10px", marginBottom:"20px" }}>
            {[
              { label:"Age",    value: profile?.age            ? `${profile.age}y`              : null },
              { label:"Height", value: profile?.height         ? `${profile.height} cm`         : null },
              { label:"Weight", value: profile?.currentWeight  ? `${profile.currentWeight} kg`  : null },
              { label:"Target", value: profile?.targetWeight   ? `${profile.targetWeight} kg`   : null },
              { label:"BMI",    value: bmi                                                              },
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
        )}

        <InfoRow label="Gender"            value={genderObj?.label} />
        <InfoRow label="Fitness Goal"      value={goalObj ? `${goalObj.icon} ${goalObj.label}` : null} />
        <InfoRow label="Fitness Level"     value={levelObj?.label} />
        <InfoRow label="Workouts/Week"     value={profile?.workoutsPerWeek ? `${profile.workoutsPerWeek} days` : null} />
        <InfoRow label="Health Notes"      value={profile?.healthNotes||null} />
        <InfoRow label="Injuries / Limits" value={profile?.injuries||null} />

        {(!profile?.age||!profile?.height||!profile?.currentWeight) && (
          <div className="alert alert-info" style={{ marginTop:"16px" }}>
            👋 Profile incomplete — click <strong>Manage Profile</strong> to fill in your details.
          </div>
        )}
      </div>
    </div>
  );

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  return (
    <div className="card">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <h3 className="font-heading" style={{ fontSize:"22px" }}>Edit Profile</h3>
        <button className="btn btn-outline btn-sm" onClick={cancelEdit}>Cancel</button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type==="error"?"error":"success"} mb-4`}>{msg.text}</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:"22px" }}>

        {/* Personal */}
        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase",
            letterSpacing:"0.8px", marginBottom:"12px" }}>Personal Details</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" min="10" max="100" placeholder="e.g. 25"
                value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender}
                onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                {GENDER_OPTIONS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input className="form-input" type="number" min="100" max="250" placeholder="e.g. 175"
                value={form.height} onChange={e=>setForm(f=>({...f,height:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Workouts per Week</label>
              <input className="form-input" type="number" min="1" max="7"
                value={form.workoutsPerWeek}
                onChange={e=>setForm(f=>({...f,workoutsPerWeek:e.target.value}))} />
            </div>
          </div>
        </section>

        {/* Weight */}
        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase",
            letterSpacing:"0.8px", marginBottom:"12px" }}>Weight</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div className="form-group">
              <label className="form-label">Current Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 75"
                value={form.currentWeight}
                onChange={e=>setForm(f=>({...f,currentWeight:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Target Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 70"
                value={form.targetWeight}
                onChange={e=>setForm(f=>({...f,targetWeight:e.target.value}))} />
            </div>
          </div>
        </section>

        {/* Goal */}
        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase",
            letterSpacing:"0.8px", marginBottom:"12px" }}>Fitness Goal</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"8px" }}>
            {GOAL_OPTIONS.map(g=>(
              <div key={g.value} onClick={()=>setForm(f=>({...f,goalType:g.value}))} style={{
                border:`1px solid ${form.goalType===g.value?"var(--accent2)":"var(--border)"}`,
                borderRadius:"var(--radius)", padding:"12px 6px", cursor:"pointer",
                background:form.goalType===g.value?"rgba(0,112,243,0.1)":"var(--bg3)",
                textAlign:"center", transition:"all 0.15s",
              }}>
                <div style={{ fontSize:"20px", marginBottom:"4px" }}>{g.icon}</div>
                <div style={{ fontSize:"11px", fontWeight:600,
                  color:form.goalType===g.value?"var(--accent2)":"var(--text2)" }}>{g.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Level */}
        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase",
            letterSpacing:"0.8px", marginBottom:"12px" }}>Fitness Level</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
            {LEVEL_OPTIONS.map(l=>(
              <div key={l.value} onClick={()=>setForm(f=>({...f,fitnessLevel:l.value}))} style={{
                border:`1px solid ${form.fitnessLevel===l.value?"var(--accent2)":"var(--border)"}`,
                borderRadius:"var(--radius)", padding:"14px 10px", cursor:"pointer",
                background:form.fitnessLevel===l.value?"rgba(0,112,243,0.1)":"var(--bg3)",
                textAlign:"center", transition:"all 0.15s",
              }}>
                <div style={{ fontWeight:700, fontSize:"13px", marginBottom:"4px",
                  color:form.fitnessLevel===l.value?"var(--accent2)":"var(--text)" }}>{l.label}</div>
                <div style={{ fontSize:"11px", color:"var(--text3)" }}>{l.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Health */}
        <section>
          <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase",
            letterSpacing:"0.8px", marginBottom:"12px" }}>Health Information</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div className="form-group">
              <label className="form-label">Health Notes</label>
              <textarea className="form-textarea" rows="2"
                placeholder="Medical conditions, allergies, or notes for your trainer…"
                value={form.healthNotes}
                onChange={e=>setForm(f=>({...f,healthNotes:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Injuries / Physical Limitations</label>
              <textarea className="form-textarea" rows="2"
                placeholder="e.g. Bad left knee, lower back pain…"
                value={form.injuries}
                onChange={e=>setForm(f=>({...f,injuries:e.target.value}))} />
            </div>
          </div>
        </section>

        <div style={{ display:"flex", gap:"10px" }}>
          <button className="btn btn-accent" style={{ flex:1 }} onClick={save} disabled={saving}>
            {saving
              ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Saving…</>
              : "✅ Update Profile"}
          </button>
          <button className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
