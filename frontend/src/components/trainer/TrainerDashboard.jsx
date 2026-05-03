import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";


const SPECS = ["Weight Loss", "Muscle Gain", "HIIT", "Yoga", "Powerlifting", "Cardio", "Nutrition", "Rehabilitation", "Sports Performance", "Flexibility"];

export default function TrainerDashboard() {
  const { token, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ bio: "", specialization: [], yearsOfExperience: "", hourlyRate: "" });
  const [relationships, setRelationships] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/coaching/mine", { headers: { Authorization: `Bearer ${token}` } });
        setRelationships(res.data.relationships || []);
      } catch {}
    })();
  }, [token]);

  const toggleSpec = (s) => {
    setProfile(p => ({
      ...p,
      specialization: p.specialization.includes(s)
        ? p.specialization.filter(x => x !== s)
        : [...p.specialization, s]
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await api.put("/trainers/profile", {
        bio: profile.bio,
        specialization: profile.specialization,
        yearsOfExperience: Number(profile.yearsOfExperience),
        hourlyRate: Number(profile.hourlyRate),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: "success", text: "Profile updated!" });
      setEditing(false);
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Update failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* My Profile Card */}
      <div className="card">
        <div className="flex-between mb-4">
          <h3 className="font-heading" style={{ fontSize: "22px" }}>My Trainer Profile</h3>
          <button className="btn btn-outline btn-sm" onClick={() => setEditing(e => !e)}>
            {editing ? "Cancel" : "✏️ Edit Profile"}
          </button>
        </div>

        {!editing ? (
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            <div className="trainer-avatar" style={{ width: "60px", height: "60px", fontSize: "26px" }}>
              {user?.name?.[0]?.toUpperCase() || "T"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "18px" }}>{user?.name}</div>
              <div style={{ color: "var(--text3)", fontSize: "13px", marginBottom: "8px" }}>{user?.email}</div>
              <p style={{ color: "var(--text2)", fontSize: "14px", marginBottom: "12px" }}>
                {profile.bio || "No bio added yet. Click Edit Profile to add one."}
              </p>
              {profile.specialization.length > 0 && (
                <div className="specialization-tags">
                  {profile.specialization.map(s => <span key={s} className="spec-tag">{s}</span>)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"}`}>{msg.text}</div>}

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" placeholder="Tell clients about your coaching style…" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input className="form-input" type="number" min="0" placeholder="e.g. 5" value={profile.yearsOfExperience} onChange={e => setProfile(p => ({ ...p, yearsOfExperience: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Hourly Rate ($)</label>
                <input className="form-input" type="number" min="0" placeholder="e.g. 60" value={profile.hourlyRate} onChange={e => setProfile(p => ({ ...p, hourlyRate: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Specializations</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {SPECS.map(s => (
                  <span
                    key={s}
                    onClick={() => toggleSpec(s)}
                    style={{
                      padding: "5px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                      border: `1px solid ${profile.specialization.includes(s) ? "var(--accent2)" : "var(--border)"}`,
                      background: profile.specialization.includes(s) ? "rgba(0,112,243,0.15)" : "var(--bg3)",
                      color: profile.specialization.includes(s) ? "var(--accent2)" : "var(--text3)",
                      transition: "all 0.15s",
                    }}
                  >{s}</span>
                ))}
              </div>
            </div>

            <button className="btn btn-accent" onClick={saveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        )}
      </div>

      {/* My Clients */}
      <div className="card">
        <h3 className="font-heading" style={{ fontSize: "22px", marginBottom: "16px" }}>My Clients</h3>
        {relationships.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">No clients yet. Get verified to appear in search results.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {relationships.map(r => (
              <div key={r._id} className="log-entry">
                <div>
                  <div style={{ fontWeight: 600 }}>{r.client?.user?.name || "Client"}</div>
                  <div style={{ color: "var(--text3)", fontSize: "12px" }}>{r.client?.user?.email}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className={`tag tag-${r.status}`}>{r.status}</span>
                  <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: "4px" }}>${r.pricePerMonth}/mo</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}