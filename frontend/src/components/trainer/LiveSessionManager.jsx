import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

function formatDT(d) {
  return new Date(d).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isLive(s) {
  const now = Date.now();
  const start = new Date(s.scheduledAt).getTime();
  return now >= start && now <= start + s.durationMinutes * 60000;
}

export default function LiveSessionManager() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [myPrograms, setMyPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [form, setForm] = useState({
    title: "", description: "", scheduledAt: "", durationMinutes: 60,
    meetingLink: "", programId: "", isOpenToAll: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const [sRes, pRes] = await Promise.all([
        api.get("/sessions/mine", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/programs/mine", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setSessions(sRes.data.sessions || []);
      setMyPrograms(pRes.data.programs || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title || !form.scheduledAt || !form.meetingLink) {
      setMsg({ type: "error", text: "Title, date/time and meeting link are required." }); return;
    }
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      await api.post("/sessions", { ...form, programId: form.programId || undefined }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: "success", text: "Session scheduled! All enrolled clients will see it." });
      setCreating(false);
      setForm({ title: "", description: "", scheduledAt: "", durationMinutes: 60, meetingLink: "", programId: "", isOpenToAll: true });
      load();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Failed to create session." });
    } finally { setSaving(false); }
  };

  const deleteSession = async (id) => {
    if (!confirm("Delete this session?")) return;
    try {
      await api.delete(`/sessions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch {}
  };

  // Min date = now formatted for datetime-local input
  const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="card">
        <div className="flex-between mb-4">
          <h3 className="font-heading" style={{ fontSize: "22px" }}>Live Sessions</h3>
          <button className="btn btn-accent btn-sm" onClick={() => setCreating(c => !c)}>
            {creating ? "✕ Cancel" : "+ Schedule Session"}
          </button>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: "140px" }}><div className="spinner"></div></div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎥</div>
            <div className="empty-state-text">No sessions scheduled yet.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {sessions.map(s => (
              <div key={s._id} style={{
                background: "var(--bg3)", border: `1px solid ${isLive(s) ? "var(--green)" : "var(--border)"}`,
                borderRadius: "var(--radius)", padding: "14px",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700 }}>{s.title}</span>
                    {isLive(s) && <span className="tag tag-approved">🔴 LIVE NOW</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text3)" }}>
                    {formatDT(s.scheduledAt)} · {s.durationMinutes}min
                    {s.program && <span> · for "{s.program.title}"</span>}
                  </div>
                  {s.description && <div style={{ fontSize: "12px", color: "var(--text2)", marginTop: "3px" }}>{s.description}</div>}
                  <a href={s.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accent2)", display: "block", marginTop: "4px" }}>
                    🔗 {s.meetingLink}
                  </a>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteSession(s._id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <div className="card">
          <h3 className="font-heading" style={{ fontSize: "20px", marginBottom: "20px" }}>Schedule a Session</h3>

          {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Session Title</label>
              <input className="form-input" placeholder="e.g. Week 2 — Full Body HIIT" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input className="form-input" placeholder="What will you cover?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input className="form-input" type="datetime-local" min={minDate} value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input className="form-input" type="number" min="15" step="15" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Zoom / Google Meet Link</label>
              <input className="form-input" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} />
            </div>

            {myPrograms.length > 0 && (
              <div className="form-group">
                <label className="form-label">Link to Program (optional)</label>
                <select className="form-select" value={form.programId} onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}>
                  <option value="">All enrolled clients</option>
                  {myPrograms.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
            )}

            <button className="btn btn-accent btn-full" onClick={save} disabled={saving}>
              {saving ? "Scheduling…" : "📅 Schedule Session"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}