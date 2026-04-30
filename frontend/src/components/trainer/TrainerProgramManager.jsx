import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const EXERCISE_SUGGESTIONS = [
  "Bench Press","Squat","Deadlift","Pull-ups","Overhead Press",
  "Barbell Row","Lunges","Plank","Push-ups","Dumbbell Curl",
  "Tricep Dips","Leg Press","Romanian Deadlift","Face Pull","Cable Row",
];

const emptyEx = () => ({ name:"", sets:3, reps:10, weight:0, restSeconds:60, videoUrl:"", notes:"" });

function toDateInput(d) {
  return new Date(d - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function ExerciseRow({ ex, idx, onChange, onRemove, canRemove }) {
  return (
    <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"12px", marginBottom:"8px" }}>
      <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
        <input className="form-input" placeholder="Exercise name" value={ex.name} list={`ex-list-${idx}`}
          onChange={e => onChange("name", e.target.value)} style={{ flex:2 }} />
        <datalist id={`ex-list-${idx}`}>{EXERCISE_SUGGESTIONS.map(s => <option key={s} value={s}/>)}</datalist>
        {canRemove && <button className="btn btn-danger btn-sm" onClick={onRemove} style={{ padding:"0 12px" }}>✕</button>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px", marginBottom:"8px" }}>
        {[["sets","Sets"],["reps","Reps"],["weight","kg"],["restSeconds","Rest(s)"]].map(([f,l]) => (
          <div key={f} className="form-group" style={{ gap:"3px" }}>
            <label className="form-label" style={{ fontSize:"9px" }}>{l}</label>
            <input className="form-input" type="number" min="0" value={ex[f]} onChange={e => onChange(f, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="form-group" style={{ gap:"4px", marginBottom:"6px" }}>
        <label className="form-label" style={{ fontSize:"9px" }}>YouTube / Vimeo URL (optional)</label>
        <input className="form-input" placeholder="https://youtube.com/watch?v=..." value={ex.videoUrl} onChange={e => onChange("videoUrl", e.target.value)} />
      </div>
      <div className="form-group" style={{ gap:"4px" }}>
        <label className="form-label" style={{ fontSize:"9px" }}>Coach note to client</label>
        <input className="form-input" placeholder="e.g. Keep core tight" value={ex.notes} onChange={e => onChange("notes", e.target.value)} />
      </div>
    </div>
  );
}

function AssignWorkoutPanel({ program, onClose }) {
  const { token } = useAuth();
  const [date, setDate] = useState(toDateInput(new Date()));
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState([emptyEx()]);
  const [existingWorkouts, setExistingWorkouts] = useState([]);
  const [msg, setMsg] = useState({ type:"", text:"" });
  const [saving, setSaving] = useState(false);
  const [loadingEx, setLoadingEx] = useState(false);

  // Load existing workouts for this program
  const loadWorkouts = async () => {
    try {
      const res = await api.get(`/daily-workouts/trainer/${program._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingWorkouts(res.data.workouts || []);
    } catch {}
  };

  useEffect(() => { loadWorkouts(); }, [program._id]);

  // When date changes, load that day's workout if it exists
  useEffect(() => {
    const existing = existingWorkouts.find(w => w.date === date);
    if (existing) {
      setTitle(existing.title || "");
      setNotes(existing.notes || "");
      setExercises(existing.exercises?.length ? existing.exercises : [emptyEx()]);
    } else {
      setTitle(""); setNotes(""); setExercises([emptyEx()]);
    }
  }, [date, existingWorkouts]);

  const updateEx = (i, field, val) => {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex));
  };

  const save = async () => {
    if (!exercises.some(e => e.name.trim())) {
      setMsg({ type:"error", text:"Add at least one exercise." }); return;
    }
    setSaving(true); setMsg({ type:"", text:"" });
    try {
      await api.post(`/daily-workouts/trainer/${program._id}`, {
        date, title, notes,
        exercises: exercises.filter(e => e.name.trim()).map(e => ({
          ...e, sets: Number(e.sets), reps: Number(e.reps),
          weight: Number(e.weight), restSeconds: Number(e.restSeconds),
        })),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type:"success", text:`Workout saved for ${date}! All enrolled clients can now see it.` });
      loadWorkouts();
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Save failed." });
    } finally { setSaving(false); }
  };

  const deleteWorkout = async (workoutId) => {
    if (!confirm("Delete this workout?")) return;
    try {
      await api.delete(`/daily-workouts/trainer/workout/${workoutId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadWorkouts();
      setExercises([emptyEx()]); setTitle(""); setNotes("");
    } catch {}
  };

  const existingForDate = existingWorkouts.find(w => w.date === date);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h4 className="font-heading" style={{ fontSize:"20px" }}>Assign Daily Workouts</h4>
          <div style={{ color:"var(--text2)", fontSize:"13px" }}>{program.title}</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onClose}>← Back</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:"16px", alignItems:"start" }}>
        {/* Calendar / date picker + assigned workouts list */}
        <div className="card" style={{ padding:"16px" }}>
          <label className="form-label" style={{ marginBottom:"8px", display:"block" }}>Select Date</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ marginBottom:"16px" }}
          />
          <div style={{ fontSize:"12px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>
            Assigned Workouts ({existingWorkouts.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"6px", maxHeight:"320px", overflowY:"auto" }}>
            {existingWorkouts.length === 0 ? (
              <div style={{ color:"var(--text3)", fontSize:"12px", textAlign:"center", padding:"16px" }}>
                No workouts assigned yet
              </div>
            ) : existingWorkouts.map(w => (
              <div
                key={w._id}
                onClick={() => setDate(w.date)}
                style={{
                  padding:"10px 12px", borderRadius:"var(--radius)", cursor:"pointer",
                  background: date === w.date ? "rgba(0,112,243,0.12)" : "var(--bg3)",
                  border: `1px solid ${date === w.date ? "var(--accent2)" : "var(--border)"}`,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  transition:"all 0.15s",
                }}
              >
                <div>
                  <div style={{ fontWeight:600, fontSize:"13px" }}>
                    {new Date(w.date + "T12:00:00").toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
                  </div>
                  <div style={{ fontSize:"11px", color:"var(--text3)" }}>
                    {w.title || `${w.exercises?.length || 0} exercises`}
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={e => { e.stopPropagation(); deleteWorkout(w._id); }}
                  style={{ padding:"2px 8px", fontSize:"11px" }}
                >✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Workout editor */}
        <div className="card" style={{ padding:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <div>
              <div style={{ fontWeight:700, fontSize:"15px" }}>
                {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
              </div>
              {existingForDate && <span className="tag tag-approved" style={{ marginTop:"4px", display:"inline-block" }}>✓ Saved</span>}
            </div>
          </div>

          {msg.text && <div className={`alert alert-${msg.type === "error" ? "error" : "success"}`} style={{ marginBottom:"12px" }}>{msg.text}</div>}

          <div className="form-group" style={{ marginBottom:"10px" }}>
            <label className="form-label">Workout Title (optional)</label>
            <input className="form-input" placeholder="e.g. Upper Body Push" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom:"12px" }}>
            <label className="form-label">Notes to Clients</label>
            <textarea className="form-textarea" rows="2" placeholder="e.g. Focus on form, rest 2min between sets…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
            <label className="form-label" style={{ margin:0 }}>Exercises</label>
            <button className="btn btn-outline btn-sm" onClick={() => setExercises(p => [...p, emptyEx()])}>+ Add</button>
          </div>

          <div style={{ maxHeight:"300px", overflowY:"auto" }}>
            {exercises.map((ex, i) => (
              <ExerciseRow key={i} ex={ex} idx={i}
                onChange={(f, v) => updateEx(i, f, v)}
                onRemove={() => setExercises(p => p.filter((_, idx) => idx !== i))}
                canRemove={exercises.length > 1}
              />
            ))}
          </div>

          <button className="btn btn-accent btn-full" style={{ marginTop:"12px" }} onClick={save} disabled={saving}>
            {saving ? <><span className="spinner" style={{ borderTopColor:"#fff" }}></span> Saving…</> : `💾 Save Workout for ${date}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function EnrolledClients({ program }) {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/programs/${program._id}/enrollments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(res.data.enrollments || []);
      } catch {} finally { setLoading(false); }
    })();
  }, [program._id]);

  if (loading) return <div className="loading-screen" style={{ minHeight:"80px" }}><div className="spinner"></div></div>;

  return (
    <div>
      <div style={{ fontSize:"12px", fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"10px" }}>
        Enrolled Clients ({clients.length})
      </div>
      {clients.length === 0 ? (
        <div style={{ color:"var(--text3)", fontSize:"13px" }}>No clients enrolled yet.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {clients.map(e => (
            <div key={e._id} style={{ display:"flex", gap:"10px", alignItems:"center", padding:"10px 12px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)" }}>
              <div className="nav-avatar" style={{ width:"32px", height:"32px", fontSize:"12px", borderRadius:"8px", flexShrink:0 }}>
                {(e.client?.user?.name || "C")[0].toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:"13px" }}>{e.client?.user?.name}</div>
                <div style={{ fontSize:"11px", color:"var(--text3)" }}>{e.client?.user?.email}</div>
              </div>
              <div style={{ fontSize:"11px", color:"var(--text3)" }}>
                Enrolled {new Date(e.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrainerProgramManager() {
  const { token } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState(null);
  const [view, setView] = useState("clients"); // "clients" | "assign"

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/programs/mine", { headers: { Authorization: `Bearer ${token}` } });
        setPrograms(res.data.programs || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="card loading-screen" style={{ minHeight:"200px" }}><div className="spinner"></div></div>;

  if (activeProgram) {
    if (view === "assign") return (
      <div className="card">
        <AssignWorkoutPanel program={activeProgram} onClose={() => setView("clients")} />
      </div>
    );

    return (
      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
          <div>
            <h3 className="font-heading" style={{ fontSize:"22px" }}>{activeProgram.title}</h3>
            <div style={{ color:"var(--text2)", fontSize:"13px", marginTop:"4px" }}>
              ${activeProgram.price} · {activeProgram.durationWeeks}w · {activeProgram.enrolledCount} enrolled
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button className="btn btn-accent btn-sm" onClick={() => setView("assign")}>📅 Assign Workouts</button>
            <button className="btn btn-outline btn-sm" onClick={() => setActiveProgram(null)}>← All Programs</button>
          </div>
        </div>
        <EnrolledClients program={activeProgram} />
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-heading" style={{ fontSize:"22px", marginBottom:"16px" }}>My Programs</h3>
      {programs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No programs yet. Create one in the program builder.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {programs.map(p => (
            <div key={p._id} style={{
              padding:"16px", background:"var(--bg3)", border:"1px solid var(--border)",
              borderRadius:"var(--radius)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px",
            }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"4px" }}>{p.title}</div>
                <div style={{ fontSize:"12px", color:"var(--text3)" }}>
                  ${p.price} · {p.durationWeeks}w · {p.enrolledCount} enrolled · {p.category?.replace("_"," ")}
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px", flexShrink:0 }}>
                <span className={`tag ${p.isPublished ? "tag-approved" : "tag-pending"}`}>
                  {p.isPublished ? "Live" : "Draft"}
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setActiveProgram(p); setView("clients"); }}
                >
                  Manage →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}