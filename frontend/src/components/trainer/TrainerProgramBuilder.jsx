import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const CATEGORIES = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" },
  { value: "general", label: "General" },
];

const emptyExercise = () => ({ name: "", sets: 3, reps: 10, weight: 0, restSeconds: 60, videoUrl: "", notes: "" });
const emptyDay = (n) => ({ dayNumber: n, title: "", exercises: [emptyExercise()] });

function ExerciseRow({ ex, onChange, onRemove, canRemove }) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px", marginBottom: "8px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input className="form-input" placeholder="Exercise name" value={ex.name} onChange={e => onChange("name", e.target.value)} style={{ flex: 2 }} />
        {canRemove && <button className="btn btn-danger btn-sm" onClick={onRemove} style={{ padding: "0 12px" }}>✕</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
        {[["sets","Sets"],["reps","Reps"],["weight","kg"],["restSeconds","Rest(s)"]].map(([f,l]) => (
          <div key={f} className="form-group" style={{ gap: "3px" }}>
            <label className="form-label" style={{ fontSize: "9px" }}>{l}</label>
            <input className="form-input" type="number" min="0" value={ex[f]} onChange={e => onChange(f, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="form-group" style={{ gap: "4px", marginBottom: "8px" }}>
        <label className="form-label" style={{ fontSize: "9px" }}>YouTube / Vimeo URL (optional)</label>
        <input className="form-input" placeholder="https://youtube.com/watch?v=..." value={ex.videoUrl} onChange={e => onChange("videoUrl", e.target.value)} />
      </div>
      <div className="form-group" style={{ gap: "4px" }}>
        <label className="form-label" style={{ fontSize: "9px" }}>Notes for client (optional)</label>
        <input className="form-input" placeholder="e.g. Keep back straight" value={ex.notes} onChange={e => onChange("notes", e.target.value)} />
      </div>
    </div>
  );
}

export default function TrainerProgramBuilder() {
  const { token } = useAuth();
  const [myPrograms, setMyPrograms] = useState([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    title: "", description: "", category: "general",
    durationWeeks: 4, price: 49, days: [emptyDay(1)],
  });

  const loadPrograms = async () => {
    try {
      const res = await api.get("/programs/mine", { headers: { Authorization: `Bearer ${token}` } });
      setMyPrograms(res.data.programs || []);
    } catch {}
  };

  useEffect(() => { loadPrograms(); }, []);

  const addDay = () => setForm(f => ({ ...f, days: [...f.days, emptyDay(f.days.length + 1)] }));
  const removeDay = (i) => setForm(f => ({ ...f, days: f.days.filter((_, idx) => idx !== i) }));

  const updateExercise = (dayIdx, exIdx, field, val) => {
    setForm(f => ({
      ...f,
      days: f.days.map((d, di) => di !== dayIdx ? d : {
        ...d,
        exercises: d.exercises.map((ex, ei) => ei !== exIdx ? ex : { ...ex, [field]: val }),
      }),
    }));
  };

  const addExercise = (dayIdx) => {
    setForm(f => ({
      ...f,
      days: f.days.map((d, di) => di !== dayIdx ? d : { ...d, exercises: [...d.exercises, emptyExercise()] }),
    }));
  };

  const removeExercise = (dayIdx, exIdx) => {
    setForm(f => ({
      ...f,
      days: f.days.map((d, di) => di !== dayIdx ? d : {
        ...d,
        exercises: d.exercises.filter((_, ei) => ei !== exIdx),
      }),
    }));
  };

  const saveProgram = async () => {
    if (!form.title.trim()) { setMsg({ type: "error", text: "Title is required." }); return; }
    if (!form.price && form.price !== 0) { setMsg({ type: "error", text: "Price is required." }); return; }
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      await api.post("/programs", form, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: "success", text: "Program published to marketplace! 🎉" });
      setCreating(false);
      setForm({ title: "", description: "", category: "general", durationWeeks: 4, price: 49, days: [emptyDay(1)] });
      loadPrograms();
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Failed to save program." });
    } finally { setSaving(false); }
  };

  const deleteProgram = async (id) => {
    if (!confirm("Delete this program?")) return;
    try {
      await api.delete(`/programs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadPrograms();
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* My published programs */}
      <div className="card">
        <div className="flex-between mb-4">
          <h3 className="font-heading" style={{ fontSize: "22px" }}>My Programs</h3>
          <button className="btn btn-accent btn-sm" onClick={() => setCreating(c => !c)}>
            {creating ? "✕ Cancel" : "+ New Program"}
          </button>
        </div>

        {myPrograms.length === 0 && !creating ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No programs yet. Create one to appear in the marketplace.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {myPrograms.map(p => (
              <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text3)" }}>
                    ${p.price} · {p.durationWeeks}w · {p.days?.length || 0} days · {p.enrolledCount} enrolled
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span className={`tag ${p.isPublished ? "tag-approved" : "tag-pending"}`}>
                    {p.isPublished ? "Live" : "Draft"}
                  </span>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteProgram(p._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="card">
          <h3 className="font-heading" style={{ fontSize: "20px", marginBottom: "20px" }}>Create New Program</h3>

          {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Program Title</label>
              <input className="form-input" placeholder="e.g. 8-Week Fat Shred" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="What will clients achieve? Who is this for?" rows="3" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (weeks)</label>
                <input className="form-input" type="number" min="1" max="52" value={form.durationWeeks} onChange={e => setForm(f => ({ ...f, durationWeeks: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input className="form-input" type="number" min="0" step="0.01" placeholder="e.g. 49" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
            </div>

            {/* Days builder */}
            <div>
              <div className="flex-between mb-3">
                <label className="form-label" style={{ margin: 0 }}>Workout Days ({form.days.length})</label>
                <button className="btn btn-outline btn-sm" onClick={addDay}>+ Add Day</button>
              </div>

              {form.days.map((day, dayIdx) => (
                <div key={dayIdx} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "var(--accent)", flexShrink: 0 }}>Day {day.dayNumber}</div>
                    <input className="form-input" placeholder="Day title (e.g. Chest & Triceps)" value={day.title} onChange={e => setForm(f => ({ ...f, days: f.days.map((d, di) => di === dayIdx ? { ...d, title: e.target.value } : d) }))} />
                    {form.days.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeDay(dayIdx)}>✕</button>}
                  </div>

                  {day.exercises.map((ex, exIdx) => (
                    <ExerciseRow
                      key={exIdx}
                      ex={ex}
                      onChange={(field, val) => updateExercise(dayIdx, exIdx, field, val)}
                      onRemove={() => removeExercise(dayIdx, exIdx)}
                      canRemove={day.exercises.length > 1}
                    />
                  ))}

                  <button className="btn btn-outline btn-sm" onClick={() => addExercise(dayIdx)} style={{ marginTop: "4px" }}>
                    + Add Exercise
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-accent btn-full btn-lg" onClick={saveProgram} disabled={saving}>
              {saving ? <><span className="spinner" style={{ borderTopColor: "#fff" }}></span> Publishing…</> : "🚀 Publish to Marketplace"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}