import { useEffect, useState, useRef } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const SPECS = ["Weight Loss", "Muscle Gain", "HIIT", "Yoga", "Powerlifting", "Cardio", "Nutrition", "Rehabilitation", "Sports Performance", "Flexibility"];

export default function TrainerDashboard() {
  const { token, user } = useAuth();
  const [editing,    setEditing]    = useState(false);
  const [profile,    setProfile]    = useState({ bio: "", specialization: [], yearsOfExperience: "", hourlyRate: "" });
  const [relationships, setRelationships] = useState([]);
  const [msg,        setMsg]        = useState({ type: "", text: "" });
  const [saving,     setSaving]     = useState(false);

  // ── Verification state ──────────────────────────────────────────────────────
  const [verifStatus,   setVerifStatus]   = useState(null);   // "pending"|"approved"|"rejected"|null
  const [rejectionReason, setRejectionReason] = useState("");
  const [showVerify,    setShowVerify]    = useState(false);
  const [certFile,      setCertFile]      = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [verifMsg,      setVerifMsg]      = useState({ type: "", text: "" });
  const verifyRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [coachRes, overRes] = await Promise.all([
          api.get("/coaching/mine",      { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { relationships: [] } })),
          api.get("/trainers/overview",  { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} })),
        ]);
        setRelationships(coachRes.data.relationships || []);
        setVerifStatus(overRes.data.verificationStatus || null);
        setRejectionReason(overRes.data.rejectionReason || "");
        // Pre-fill profile if available
        if (overRes.data.bio !== undefined) {
          setProfile(p => ({
            ...p,
            bio:               overRes.data.bio               || p.bio,
            specialization:    overRes.data.specialization    || p.specialization,
            yearsOfExperience: overRes.data.yearsOfExperience || p.yearsOfExperience,
            hourlyRate:        overRes.data.hourlyRate        || p.hourlyRate,
          }));
        }
      } catch {}
    })();
  }, [token]);

  const scrollToVerify = () => {
    setShowVerify(true);
    setTimeout(() => verifyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  };

  const submitVerification = async () => {
    if (!certFile) { setVerifMsg({ type: "error", text: "Please select a certificate file." }); return; }
    setSubmitting(true);
    setVerifMsg({ type: "", text: "" });
    try {
      const form = new FormData();
      form.append("certificate", certFile);
      await api.post("/trainers/verification", form, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setVerifMsg({ type: "success", text: "✅ Submitted! Our team will review your certificate shortly." });
      setVerifStatus("pending");
      setCertFile(null);
    } catch (e) {
      setVerifMsg({ type: "error", text: e?.response?.data?.message || "Submission failed. Please try again." });
    } finally { setSubmitting(false); }
  };

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
      {/* ── Verification Banner — shown when not yet approved ── */}
      {verifStatus !== "approved" && verifStatus !== null && (
        <div style={{
          borderRadius: "12px", padding: "16px 20px",
          background: verifStatus === "rejected"
            ? "rgba(248,113,113,0.07)" : "rgba(245,158,11,0.07)",
          border: `1px solid ${verifStatus === "rejected"
            ? "rgba(248,113,113,0.25)" : "rgba(245,158,11,0.25)"}`,
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "14px", flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "22px" }}>
              {verifStatus === "rejected" ? "❌" : "⏳"}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px",
                color: verifStatus === "rejected" ? "#f87171" : "var(--gold, #fbbf24)" }}>
                {verifStatus === "rejected" ? "Verification Rejected" : "Verification Pending"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: "2px" }}>
                {verifStatus === "rejected"
                  ? (rejectionReason ? `Reason: ${rejectionReason}` : "Your documents were rejected. Please resubmit.")
                  : "Submit your certificate to get verified and appear in search results."}
              </div>
            </div>
          </div>
          <button
            onClick={scrollToVerify}
            style={{
              padding: "8px 18px", borderRadius: "8px", fontSize: "12px",
              fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              background: verifStatus === "rejected"
                ? "rgba(248,113,113,0.15)" : "rgba(245,158,11,0.15)",
              border: `1px solid ${verifStatus === "rejected"
                ? "rgba(248,113,113,0.35)" : "rgba(245,158,11,0.35)"}`,
              color: verifStatus === "rejected" ? "#f87171" : "var(--gold, #fbbf24)",
            }}>
            {verifStatus === "rejected" ? "Resubmit Documents ↓" : "Submit Documents ↓"}
          </button>
        </div>
      )}

      {/* ── Verification not fetched yet — nudge banner ── */}
      {verifStatus === null && (
        <div style={{
          borderRadius: "12px", padding: "14px 20px",
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.2)",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <span style={{ fontSize: "20px" }}>📋</span>
          <div style={{ fontSize: "13px", color: "var(--text2)" }}>
            Complete your profile and <button onClick={scrollToVerify}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "var(--gold, #fbbf24)", fontWeight: 700, fontSize: "13px",
                padding: 0, textDecoration: "underline" }}>
              submit verification documents
            </button> to start accepting clients.
          </div>
        </div>
      )}
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