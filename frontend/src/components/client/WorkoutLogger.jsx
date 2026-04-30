import { useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const EXERCISE_TEMPLATES = ["Bench Press", "Squat", "Deadlift", "Pull-ups", "Overhead Press", "Rows", "Lunges", "Plank"];

const emptyExercise = () => ({ name: "", sets: "", reps: "", weight: "" });

export default function WorkoutLogger() {
  const { token } = useAuth();
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState([emptyExercise()]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const updateEx = (i, field, val) => {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex));
  };

  const addExercise = () => setExercises(prev => [...prev, emptyExercise()]);
  const removeExercise = (i) => setExercises(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!weight) { setMsg({ type: "error", text: "Please enter your current weight." }); return; }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const completedExercises = exercises
        .filter(ex => ex.name)
        .map(ex => ({
          name: ex.name,
          sets: Number(ex.sets) || 0,
          reps: Number(ex.reps) || 0,
          weight: Number(ex.weight) || 0,
        }));

      await api.post("/workouts/logs", {
        weight: Number(weight),
        notes,
        completedExercises,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMsg({ type: "success", text: "Workout logged successfully! 🔥" });
      setWeight("");
      setNotes("");
      setExercises([emptyExercise()]);
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Could not save log." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-heading" style={{ fontSize: "22px", marginBottom: "20px" }}>Daily Workout Log</h3>

      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : "success"} mb-4`}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Body Weight */}
        <div className="form-group">
          <label className="form-label">Current Weight (kg)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 75.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
        </div>

        {/* Exercises */}
        <div>
          <div className="flex-between mb-3">
            <label className="form-label" style={{ margin: 0 }}>Exercises</label>
            <button className="btn btn-outline btn-sm" onClick={addExercise}>+ Add Exercise</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {exercises.map((ex, i) => (
              <div key={i} style={{
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "14px",
              }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <input
                    className="form-input"
                    placeholder="Exercise name"
                    value={ex.name}
                    list={`ex-list-${i}`}
                    onChange={e => updateEx(i, "name", e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <datalist id={`ex-list-${i}`}>
                    {EXERCISE_TEMPLATES.map(t => <option key={t} value={t} />)}
                  </datalist>
                  {exercises.length > 1 && (
                    <button className="btn btn-danger btn-sm" onClick={() => removeExercise(i)} style={{ padding: "0 12px" }}>✕</button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {["sets", "reps", "weight"].map(field => (
                    <div key={field} className="form-group" style={{ gap: "4px" }}>
                      <label className="form-label" style={{ fontSize: "10px" }}>
                        {field === "weight" ? "Weight (kg)" : field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        className="form-input"
                        type="number" min="0"
                        placeholder={field === "weight" ? "kg" : "0"}
                        value={ex[field]}
                        onChange={e => updateEx(i, field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Session Notes</label>
          <textarea
            className="form-textarea"
            rows="3"
            placeholder="How did it feel? Any PRs today?"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button className="btn btn-accent btn-full" onClick={save} disabled={loading}>
          {loading ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Saving…</> : "💾 Save Workout Log"}
        </button>
      </div>
    </div>
  );
}