import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

function getYTEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
}

function isLive(s) {
  const now = Date.now();
  const start = new Date(s.scheduledAt).getTime();
  return now >= start && now <= start + s.durationMinutes * 60000;
}

function formatDT(d) {
  return new Date(d).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Rest Timer ────────────────────────────────────────────────────────────────
function RestTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current); onDone(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const pct = Math.round(((seconds - remaining) / seconds) * 100);
  const r = 38, circ = 2 * Math.PI * r;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"20px",
      background:"rgba(0,112,243,0.08)", border:"1px solid rgba(0,112,243,0.3)", borderRadius:"12px" }}>
      <div style={{ fontSize:"13px", fontWeight:700, color:"var(--accent)", marginBottom:"12px",
        textTransform:"uppercase", letterSpacing:"0.5px" }}>
        💤 Rest Time
      </div>
      <div style={{ position:"relative", width:"90px", height:"90px" }}>
        <svg width="90" height="90" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle cx="45" cy="45" r={r} fill="none" stroke="var(--accent)" strokeWidth="8"
            strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"
            style={{ transition:"stroke-dasharray 0.9s linear" }} />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
          justifyContent:"center", fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px",
          color:"var(--accent)" }}>
          {remaining}
        </div>
      </div>
      <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"8px" }}>seconds remaining</div>
      <button className="btn btn-outline btn-sm" style={{ marginTop:"12px" }} onClick={onDone}>
        Skip Rest →
      </button>
    </div>
  );
}

// ── Exercise Card with Start/Timer/Complete ────────────────────────────────────
function ExerciseCard({ ex, exIndex, logEx, onUpdateLog, isCompleted, onMarkDone, completion }) {
  // state: "idle" | "active" | "resting" | "done"
  const [phase, setPhase]       = useState(isCompleted ? "done" : "idle");
  const [elapsed, setElapsed]   = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const timerRef = useRef(null);
  const embed = getYTEmbed(ex.videoUrl);

  // Elapsed timer while active
  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const fmtTime = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  const handleStart = () => { setPhase("active"); setElapsed(0); setCurrentSet(1); };

  const handleSetDone = () => {
    if (currentSet < ex.sets) {
      setCurrentSet(s => s + 1);
      setPhase("resting");
    } else {
      setPhase("done");
      onMarkDone(exIndex);
    }
  };

  const handleRestDone = () => setPhase("active");

  const phaseColors = { idle:"var(--border)", active:"var(--accent)", resting:"var(--gold)", done:"var(--green)" };

  return (
    <div style={{ background:"var(--bg3)", border:`2px solid ${phaseColors[phase]}`,
      borderRadius:"var(--radius)", padding:"16px", transition:"border-color 0.3s" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:"15px", color:"var(--text)" }}>{ex.name}</div>
          {ex.notes && <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>💬 {ex.notes}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px" }}>
            {ex.sets}×{ex.reps}
            {ex.weight > 0 && <span style={{ fontSize:"13px", color:"var(--text3)", marginLeft:"5px" }}>@ {ex.weight}kg</span>}
          </div>
          <div style={{ fontSize:"10px", color:"var(--text3)" }}>Rest: {ex.restSeconds}s</div>
        </div>
      </div>

      {/* Video */}
      {embed && phase === "active" && (
        <div style={{ borderRadius:"8px", overflow:"hidden", aspectRatio:"16/9", marginBottom:"12px" }}>
          <iframe src={embed} style={{ width:"100%", height:"100%", border:"none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen title={ex.name} />
        </div>
      )}
      {ex.videoUrl && !embed && (
        <a href={ex.videoUrl} target="_blank" rel="noreferrer"
          className="btn btn-outline btn-sm" style={{ marginBottom:"10px", display:"inline-block" }}>
          ▶ Watch Video
        </a>
      )}

      {/* IDLE — Start button */}
      {phase === "idle" && (
        <button className="btn btn-accent btn-full" onClick={handleStart}
          style={{ marginTop:"6px" }}>
          ▶ Start Exercise
        </button>
      )}

      {/* ACTIVE — set tracker + elapsed + log inputs */}
      {phase === "active" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            marginBottom:"12px", padding:"10px 14px",
            background:"rgba(0,112,243,0.08)", borderRadius:"8px" }}>
            <div>
              <div style={{ fontSize:"12px", color:"var(--text3)" }}>Current Set</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px",
                color:"var(--accent)", lineHeight:1 }}>
                {currentSet} / {ex.sets}
              </div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"12px", color:"var(--text3)" }}>Elapsed</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px",
                color:"var(--gold)", lineHeight:1 }}>
                {fmtTime(elapsed)}
              </div>
            </div>
            {/* Set dots */}
            <div style={{ display:"flex", gap:"6px" }}>
              {Array.from({ length: ex.sets }).map((_, i) => (
                <div key={i} style={{ width:"10px", height:"10px", borderRadius:"50%",
                  background: i < currentSet - 1 ? "var(--green)"
                            : i === currentSet - 1 ? "var(--accent)" : "var(--border)" }} />
              ))}
            </div>
          </div>

          {/* Log actual performance */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"12px" }}>
            {[["sets","Sets"],["reps","Reps"],["weight","Weight (kg)"]].map(([f,l]) => (
              <div key={f}>
                <label style={{ fontSize:"10px", fontWeight:700, color:"var(--text3)",
                  textTransform:"uppercase", display:"block", marginBottom:"3px" }}>{l}</label>
                <input className="form-input" type="number" min="0"
                  value={logEx[f]} onChange={e => onUpdateLog(exIndex, f, e.target.value)} />
              </div>
            ))}
          </div>

          <button className="btn btn-success btn-full" onClick={handleSetDone}>
            {currentSet < ex.sets ? `✓ Set ${currentSet} Done — Rest ${ex.restSeconds}s` : "✓ Final Set Done!"}
          </button>
        </div>
      )}

      {/* RESTING — rest timer */}
      {phase === "resting" && (
        <RestTimer seconds={ex.restSeconds || 60} onDone={handleRestDone} />
      )}

      {/* DONE */}
      {phase === "done" && (
        <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px",
          background:"rgba(16,185,129,0.1)", borderRadius:"8px",
          border:"1px solid rgba(16,185,129,0.3)" }}>
          <span style={{ fontSize:"22px" }}>✅</span>
          <div>
            <div style={{ fontWeight:700, color:"var(--green)", fontSize:"13px" }}>Exercise Completed!</div>
            <div style={{ fontSize:"11px", color:"var(--text3)" }}>
              {logEx.sets}×{logEx.reps} @ {logEx.weight}kg
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Daily Workout Logger ──────────────────────────────────────────────────────
function DailyWorkoutView({ programId, token }) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [workout, setWorkout] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [logData, setLogData] = useState({ bodyWeight: "", notes: "", exercises: [] });
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/daily-workouts/client/${programId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllWorkouts(res.data.workouts || []);
      } catch {}
    })();
  }, [programId]);

  useEffect(() => {
    setLoading(true);
    setWorkout(null);
    setCompletion(null);
    setSessionStarted(false);
    setCompletedExercises(new Set());
    setMsg({ type: "", text: "" });
    (async () => {
      try {
        const res = await api.get(`/daily-workouts/client/${programId}/day?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkout(res.data.workout || null);
        setCompletion(res.data.completion || null);
        if (res.data.workout && !res.data.completion) {
          setLogData({
            bodyWeight: "",
            notes: "",
            exercises: res.data.workout.exercises.map(ex => ({
              name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight,
            })),
          });
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [selectedDate, programId]);

  const updateLogEx = (i, field, val) => {
    setLogData(d => ({
      ...d,
      exercises: d.exercises.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex),
    }));
  };

  const handleMarkDone = (exIndex) => {
    setCompletedExercises(prev => new Set([...prev, exIndex]));
  };

  const saveLog = async () => {
    if (!workout) return;
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      await api.post(`/daily-workouts/client/complete/${workout._id}`, {
        completedExercises: logData.exercises,
        bodyWeight: Number(logData.bodyWeight) || 0,
        notes: logData.notes,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: "success", text: "Workout logged! Great work 💪 +10 FlexPoints earned!" });
      setSessionStarted(false);
      const res = await api.get(`/daily-workouts/client/${programId}/day?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompletion(res.data.completion);
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Save failed." });
    } finally { setSaving(false); }
  };

  const allDone = workout && completedExercises.size >= workout.exercises.length;

  return (
    <div>
      {/* Date picker */}
      <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"16px", flexWrap:"wrap" }}>
        <input type="date" className="form-input" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)} style={{ maxWidth:"180px" }} />
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {allWorkouts.map(w => (
            <button key={w.date}
              className={`btn btn-sm ${selectedDate === w.date ? "btn-primary" : "btn-outline"}`}
              onClick={() => setSelectedDate(w.date)}
              style={{ fontSize:"11px", padding:"5px 10px" }}>
              {new Date(w.date + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" })}
            </button>
          ))}
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type === "error" ? "error" : "success"}`}
          style={{ marginBottom:"12px" }}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ minHeight:"120px" }}><div className="spinner"></div></div>
      ) : !workout ? (
        <div className="empty-state" style={{ padding:"32px" }}>
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">No workout assigned for this date yet.</div>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
            marginBottom:"16px" }}>
            <div>
              <div style={{ fontWeight:700, fontSize:"16px", color:"var(--accent)" }}>
                {workout.title || `Workout — ${selectedDate}`}
              </div>
              {workout.notes && (
                <div style={{ color:"var(--text2)", fontSize:"13px", marginTop:"4px" }}>📝 {workout.notes}</div>
              )}
              <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"4px" }}>
                {workout.exercises.length} exercises · {completedExercises.size}/{workout.exercises.length} done
              </div>
            </div>
            {completion
              ? <span className="tag tag-approved">✓ Completed</span>
              : !sessionStarted
              ? (
                <button className="btn btn-accent" onClick={() => setSessionStarted(true)}>
                  ▶ Start Session
                </button>
              )
              : (
                <button className="btn btn-outline btn-sm"
                  onClick={() => { setSessionStarted(false); setCompletedExercises(new Set()); }}>
                  ✕ Cancel
                </button>
              )
            }
          </div>

          {/* Progress bar */}
          {sessionStarted && !completion && (
            <div style={{ marginBottom:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px",
                color:"var(--text3)", marginBottom:"4px" }}>
                <span>Session Progress</span>
                <span>{completedExercises.size}/{workout.exercises.length} exercises</span>
              </div>
              <div style={{ height:"6px", background:"var(--border)", borderRadius:"3px" }}>
                <div style={{ height:"100%", borderRadius:"3px", background:"var(--green)",
                  width:`${(completedExercises.size/workout.exercises.length)*100}%`,
                  transition:"width 0.4s" }} />
              </div>
            </div>
          )}

          {/* Exercises — interactive if session started, static view if not */}
          <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginBottom:"16px" }}>
            {workout.exercises.map((ex, i) =>
              sessionStarted && !completion ? (
                <ExerciseCard key={i} ex={ex} exIndex={i}
                  logEx={logData.exercises[i] || { sets:ex.sets, reps:ex.reps, weight:ex.weight }}
                  onUpdateLog={updateLogEx}
                  isCompleted={completedExercises.has(i)}
                  onMarkDone={handleMarkDone}
                  completion={completion} />
              ) : (
                /* Static view before session starts */
                <div key={i} style={{ background:"var(--bg3)", border:"1px solid var(--border)",
                  borderRadius:"var(--radius)", padding:"14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                    <div style={{ fontWeight:700, fontSize:"14px" }}>{ex.name}</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px" }}>
                      {ex.sets}×{ex.reps}
                      {ex.weight > 0 && <span style={{ fontSize:"13px", color:"var(--text2)", marginLeft:"6px" }}>@ {ex.weight}kg</span>}
                    </div>
                  </div>
                  {ex.notes && <div style={{ fontSize:"12px", color:"var(--text3)", marginBottom:"6px" }}>💬 {ex.notes}</div>}
                  <div style={{ fontSize:"11px", color:"var(--text3)" }}>Rest: {ex.restSeconds}s</div>
                  {getYTEmbed(ex.videoUrl) && (
                    <div style={{ borderRadius:"8px", overflow:"hidden", aspectRatio:"16/9", marginTop:"10px" }}>
                      <iframe src={getYTEmbed(ex.videoUrl)} style={{ width:"100%", height:"100%", border:"none" }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen title={ex.name} />
                    </div>
                  )}
                  {ex.videoUrl && !getYTEmbed(ex.videoUrl) && (
                    <a href={ex.videoUrl} target="_blank" rel="noreferrer"
                      className="btn btn-outline btn-sm" style={{ marginTop:"6px" }}>▶ Watch Video</a>
                  )}
                </div>
              )
            )}
          </div>

          {/* Completed banner */}
          {completion && (
            <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)",
              borderRadius:"var(--radius)", padding:"14px" }}>
              <div style={{ fontWeight:700, color:"var(--green)", marginBottom:"10px" }}>✓ Your Performance</div>
              {completion.bodyWeight > 0 && (
                <div style={{ fontSize:"13px", marginBottom:"8px" }}>
                  Body weight: <strong>{completion.bodyWeight} kg</strong>
                </div>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {completion.completedExercises.map((ex, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px" }}>
                    <span>{ex.name}</span>
                    <span style={{ color:"var(--text2)" }}>{ex.sets}×{ex.reps} @ {ex.weight}kg</span>
                  </div>
                ))}
              </div>
              {completion.notes && <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"8px" }}>Note: {completion.notes}</div>}
            </div>
          )}

          {/* Final log form — shown when all exercises done */}
          {sessionStarted && allDone && !completion && (
            <div style={{ background:"var(--bg3)", border:"1px solid var(--accent)44",
              borderRadius:"var(--radius)", padding:"16px", marginTop:"8px" }}>
              <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"14px", color:"var(--green)" }}>
                🎉 All exercises done! Save your session.
              </div>

              <div className="form-group" style={{ marginBottom:"12px" }}>
                <label className="form-label">Body Weight (kg)</label>
                <input className="form-input" type="number" step="0.1" placeholder="e.g. 75.5"
                  value={logData.bodyWeight}
                  onChange={e => setLogData(d => ({ ...d, bodyWeight: e.target.value }))} />
              </div>

              <div className="form-group" style={{ marginBottom:"14px" }}>
                <label className="form-label">Session Notes</label>
                <textarea className="form-textarea" rows="2"
                  placeholder="How did it feel? Any PRs today? 💪"
                  value={logData.notes}
                  onChange={e => setLogData(d => ({ ...d, notes: e.target.value }))} />
              </div>

              <button className="btn btn-accent btn-full" onClick={saveLog} disabled={saving}>
                {saving
                  ? <><span className="spinner" style={{ borderTopColor:"#fff" }}></span> Saving…</>
                  : "💾 Save Workout Log"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Progress Summary ──────────────────────────────────────────────────────────
function ProgressSummary({ programId, token }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/daily-workouts/client/${programId}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProgress(res.data);
      } catch {}
    })();
  }, [programId]);

  if (!progress) return null;

  const pct = progress.percentage || 0;

  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontWeight: 700, fontSize: "14px" }}>Program Progress</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "var(--accent)" }}>{pct}%</span>
      </div>
      <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--accent2), var(--accent))", borderRadius: "3px", transition: "width 0.5s" }} />
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
        <span style={{ fontSize: "12px", color: "var(--text3)" }}>
          <strong style={{ color: "var(--green)" }}>{progress.completedCount}</strong> completed
        </span>
        <span style={{ fontSize: "12px", color: "var(--text3)" }}>
          <strong style={{ color: "var(--text)" }}>{progress.totalWorkouts}</strong> total workouts
        </span>
      </div>
    </div>
  );
}

// ── Live Sessions for a Program ───────────────────────────────────────────────
function ProgramSessions({ programId, trainerId, token }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch all sessions for enrolled trainers — no extra filter needed
        const res = await api.get(`/sessions/for-me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const all = res.data.sessions || [];
        // Show sessions that belong to this specific program OR this trainer
        const relevant = all.filter(s => {
          const matchProgram = s.program && String(s.program?._id || s.program) === String(programId);
          const matchTrainer = s.trainer && (
            String(s.trainer?._id) === String(trainerId) ||
            String(s.trainer) === String(trainerId)
          );
          return matchProgram || matchTrainer;
        });
        // If no filtered results but there are sessions, show all (trainer may not link to program)
        setSessions(relevant.length > 0 ? relevant : all.filter(s =>
          String(s.trainer?._id) === String(trainerId) ||
          String(s.trainer) === String(trainerId)
        ));
      } catch {} finally { setLoading(false); }
    })();
  }, [programId, trainerId]);

  if (loading) return (
    <div style={{ padding:"20px 0", color:"var(--text3)", fontSize:"13px" }}>Loading sessions…</div>
  );

  if (sessions.length === 0) return (
    <div className="empty-state" style={{ padding:"28px" }}>
      <div className="empty-state-icon">🎥</div>
      <div className="empty-state-text">No live sessions scheduled yet. Your trainer will add sessions here.</div>
    </div>
  );

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>🎥 Live Sessions</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sessions.map(s => (
          <div key={s._id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px",
            background: isLive(s) ? "rgba(16,185,129,0.08)" : "var(--bg3)",
            border: `1px solid ${isLive(s) ? "var(--green)" : "var(--border)"}`,
            borderRadius: "var(--radius)", gap: "12px",
          }}>
            <div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "3px" }}>
                <span style={{ fontWeight: 700, fontSize: "13px" }}>{s.title}</span>
                {isLive(s) && (
                  <span className="tag tag-approved" style={{ animation: "pulse 1.5s infinite" }}>🔴 LIVE</span>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text3)" }}>
                {formatDT(s.scheduledAt)} · {s.durationMinutes}min · by {s.trainer?.user?.name}
              </div>
            </div>
            <a
              href={s.meetingLink}
              target="_blank"
              rel="noreferrer"
              className={`btn btn-sm ${isLive(s) ? "btn-accent" : "btn-outline"}`}
              style={{ flexShrink: 0 }}
            >
              {isLive(s) ? "Join Now 🚀" : "View Link"}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MyRegisteredPrograms() {
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEnrollment, setActiveEnrollment] = useState(null);
  const [activeTab, setActiveTab] = useState("workout"); // "workout" | "progress"

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/programs/enrolled", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const enrs = res.data.enrollments || [];
        setEnrollments(enrs);
        if (enrs.length > 0) setActiveEnrollment(enrs[0]);
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div className="card loading-screen" style={{ minHeight: "200px" }}>
      <div className="spinner"></div>
    </div>
  );

  if (enrollments.length === 0) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <div className="empty-state-text">
          You haven't registered for any programs yet. Browse the marketplace to find one!
        </div>
      </div>
    </div>
  );

  const program = activeEnrollment?.program;
  const trainer = program?.trainer;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Program selector */}
      {enrollments.length > 1 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {enrollments.map(e => (
            <button
              key={e._id}
              className={`btn btn-sm ${activeEnrollment?._id === e._id ? "btn-primary" : "btn-outline"}`}
              onClick={() => { setActiveEnrollment(e); setActiveTab("workout"); }}
            >
              {e.program?.title}
            </button>
          ))}
        </div>
      )}

      {program && (
        <>
          {/* Program hero card */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "14px" }}>
              <div className="trainer-avatar" style={{ width: "52px", height: "52px", fontSize: "20px", borderRadius: "14px", flexShrink: 0 }}>
                {(trainer?.user?.name || "T")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "2px" }}>{program.title}</div>
                <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "6px" }}>
                  by {trainer?.user?.name} · {program.durationWeeks}w program
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span className="tag tag-active" style={{ textTransform: "capitalize" }}>
                    {program.category?.replace("_", " ")}
                  </span>
                  <span className="tag tag-approved">✓ Registered</span>
                  <span style={{ fontSize: "11px", color: "var(--text3)", alignSelf: "center" }}>
                    Enrolled {new Date(activeEnrollment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", color: "var(--gold)" }}>
                  ${activeEnrollment.amountPaid}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text3)" }}>paid</div>
              </div>
            </div>

            {program.description && (
              <p style={{ color: "var(--text2)", fontSize: "13px" }}>{program.description}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="tabs" style={{ marginBottom: "20px" }}>
              <button className={`tab-btn ${activeTab === "workout" ? "active" : ""}`} onClick={() => setActiveTab("workout")}>
                🏋️ Today's Workout
              </button>
              <button className={`tab-btn ${activeTab === "progress" ? "active" : ""}`} onClick={() => setActiveTab("progress")}>
                📈 My Progress
              </button>
              <button className={`tab-btn ${activeTab === "sessions" ? "active" : ""}`} onClick={() => setActiveTab("sessions")}>
                🎥 Live Sessions
              </button>
            </div>

            {activeTab === "workout" && (
              <>
                <ProgressSummary programId={program._id} token={token} />
                <DailyWorkoutView programId={program._id} token={token} />
              </>
            )}

            {activeTab === "progress" && (
              <ProgressFull programId={program._id} token={token} />
            )}

            {activeTab === "sessions" && (
              <ProgramSessions
                programId={program._id}
                trainerId={trainer?._id}
                token={token}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Full Progress History ─────────────────────────────────────────────────────
function ProgressFull({ programId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/daily-workouts/client/${programId}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch {} finally { setLoading(false); }
    })();
  }, [programId]);

  if (loading) return <div className="loading-screen" style={{ minHeight: "120px" }}><div className="spinner"></div></div>;
  if (!data || data.completions.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon">📊</div>
      <div className="empty-state-text">No workouts logged yet. Start with today's workout!</div>
    </div>
  );

  const pct = data.percentage || 0;
  const weights = data.completions.filter(c => c.bodyWeight > 0).map(c => c.bodyWeight);
  const latestWeight = weights[weights.length - 1];
  const firstWeight = weights[0];
  const weightDiff = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null;

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: "var(--accent)", fontSize: "32px" }}>{pct}%</div>
          <div className="stat-card-label">Completion Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: "var(--green)", fontSize: "32px" }}>{data.completedCount}</div>
          <div className="stat-card-label">Workouts Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: "var(--gold)", fontSize: "32px" }}>
            {latestWeight ? `${latestWeight}kg` : "—"}
          </div>
          <div className="stat-card-label">
            {weightDiff !== null
              ? `${Number(weightDiff) > 0 ? "+" : ""}${weightDiff}kg change`
              : "Current Weight"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text3)", marginBottom: "6px" }}>
          <span>{data.completedCount} of {data.totalWorkouts} workouts</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: "8px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--accent2), var(--accent))", borderRadius: "4px", transition: "width 0.6s" }} />
        </div>
      </div>

      {/* Completion history */}
      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>Workout History</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[...data.completions].reverse().map((c, i) => (
          <div key={c._id || i} style={{
            background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "12px 14px",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "4px" }}>
                {new Date(c.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {c.completedExercises.map((ex, ei) => (
                  <span key={ei} className="spec-tag" style={{ fontSize: "10px" }}>
                    {ex.name} {ex.sets}×{ex.reps}
                  </span>
                ))}
              </div>
              {c.notes && <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "4px" }}>{c.notes}</div>}
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              {c.bodyWeight > 0 && (
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "var(--accent)" }}>
                  {c.bodyWeight}kg
                </div>
              )}
              <span className="tag tag-approved" style={{ fontSize: "10px" }}>✓ Done</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}