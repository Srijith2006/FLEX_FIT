import { useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const emptyDay = (label) => ({ day: label, exercises: [{ name: "", sets: 3, reps: 10, weight: 0 }] });

export default function ProgramBuilder() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState([emptyDay("Day 1")]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const addDay = () => setDays(d => [...d, emptyDay(`Day ${d.length + 1}`)]);
  const removeDay = (i) => setDays(d => d.filter((_, idx) => idx !== i));

  const updateExercise = (dayIdx, exIdx, field, val) => {
    setDays(prev => prev.map((d, di) => di !== dayIdx ? d : {
      ...d,
      exercises: d.exercises.map((ex, ei) => ei !== exIdx ? ex : { ...ex, [field]: val })
    }));
  };

  const addExercise = (dayIdx) => {
    setDays(prev => prev.map((d, di) => di !== dayIdx ? d : {
      ...d,
      exercises: [...d.exercises, { name: "", sets: 3, reps: 10, weight: 0 }]
    }));
  };

  const removeExercise = (dayIdx, exIdx) => {
    setDays(prev => prev.map((d, di) => di !== dayIdx ? d : {
      ...d,
      exercises: d.exercises.filter((_, ei) => ei !== exIdx)
    }));
  };

  const save = async () => {
    if (!title.trim()) { setMsg({ type: "error", text: "Program title is required." }); return; }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      await api.post("/workouts/programs", { title, description, days }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: "success", text: "Program created successfully! 🎉" });
      setTitle(""); setDescription("");
      setDays([emptyDay("Day 1")]);
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Failed to create program." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-heading" style={{ fontSize: "22px", marginBottom: "20px" }}>Build Workout Program</h3>

      {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>{msg.text}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-group">
          <label className="form-label">Program Title</label>
          <input className="form-input" placeholder="e.g. 4-Week Fat Loss Program" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Describe the program goals and structure…" rows="2" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* Days */}
        <div>
          <div className="flex-between mb-3">
            <label className="form-label" style={{ margin: 0 }}>Workout Days ({days.length})</label>
            <button className="btn btn-outline btn-sm" onClick={addDay}>+ Add Day</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {days.map((day, dayIdx) => (
              <div key={dayIdx} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px" }}>
                <div className="flex-between mb-3">
                  <input
                    className="form-input"
                    value={day.day}
                    style={{ maxWidth: "180px" }}
                    onChange={e => setDays(prev => prev.map((d, di) => di === dayIdx ? { ...d, day: e.target.value } : d))}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-outline btn-sm" onClick={() => addExercise(dayIdx)}>+ Exercise</button>
                    {days.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeDay(dayIdx)}>✕ Day</button>}
                  </div>
                </div>

                {day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <input className="form-input" placeholder="Exercise name" value={ex.name} onChange={e => updateExercise(dayIdx, exIdx, "name", e.target.value)} style={{ flex: 3 }} />
                    <input className="form-input" type="number" min="1" placeholder="Sets" value={ex.sets} onChange={e => updateExercise(dayIdx, exIdx, "sets", e.target.value)} style={{ flex: 1 }} />
                    <input className="form-input" type="number" min="1" placeholder="Reps" value={ex.reps} onChange={e => updateExercise(dayIdx, exIdx, "reps", e.target.value)} style={{ flex: 1 }} />
                    <input className="form-input" type="number" min="0" placeholder="kg" value={ex.weight} onChange={e => updateExercise(dayIdx, exIdx, "weight", e.target.value)} style={{ flex: 1 }} />
                    {day.exercises.length > 1 && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeExercise(dayIdx, exIdx)} style={{ padding: "0 10px", flexShrink: 0 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-accent btn-full" onClick={save} disabled={loading}>
          {loading ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Creating…</> : "📋 Create Program"}
        </button>
      </div>
    </div>
  );
}