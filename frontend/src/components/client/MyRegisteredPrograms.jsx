import { useEffect, useRef, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

// ── helpers ───────────────────────────────────────────────────────────────────
function getYTEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
}
function isLive(s) {
  const now = Date.now(), start = new Date(s.scheduledAt).getTime();
  return now >= start && now <= start + s.durationMinutes * 60000;
}
function formatDT(d) {
  return new Date(d).toLocaleString("en-US", {
    weekday:"short", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit",
  });
}
function fmt(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ── Session Tracker ───────────────────────────────────────────────────────────
function SessionTracker({ program, token, onDone }) {
  const [phase, setPhase]     = useState("idle");   // idle | running | submitting | done
  const [elapsed, setElapsed] = useState(0);
  const [videoFile, setVideo] = useState(null);
  const [uploading, setUp]    = useState(false);
  const [msg, setMsg]         = useState({ type:"", text:"" });
  const [previewUrl, setPreview] = useState(null);
  const intervalRef = useRef(null);
  const startRef    = useRef(null);

  // Start timer
  const startSession = () => {
    setElapsed(0); setPhase("running");
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
  };

  // Stop timer → show proof upload modal
  const stopSession = () => {
    clearInterval(intervalRef.current);
    setPhase("submitting");
  };

  // Discard session
  const cancelSession = () => {
    clearInterval(intervalRef.current);
    setElapsed(0); setPhase("idle"); setVideo(null); setPreview(null);
    setMsg({ type:"", text:"" });
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setVideo(f);
    // Video preview
    if (f.type.startsWith("video/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const submitSession = async () => {
    setUp(true); setMsg({ type:"", text:"" });
    try {
      const fd = new FormData();
      fd.append("programId",  program._id);
      fd.append("duration",   String(elapsed));
      fd.append("timestamp",  new Date().toISOString());
      if (videoFile) fd.append("videoFile", videoFile);

      const res = await api.post("/clients/submit-session", fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type — browser sets it automatically with boundary
        },
      });
      setMsg({ type:"success", text: res.data.message || "Session saved! 🔥" });
      setPhase("done");
      onDone?.();
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Submission failed." });
    } finally { setUp(false); }
  };

  // ── IDLE — show Start button ───────────────────────────────────────────────
  if (phase === "idle") return (
    <button
      className="btn btn-accent btn-full"
      style={{ fontSize:"14px", padding:"12px" }}
      onClick={startSession}
    >
      ▶ Start Session
    </button>
  );

  // ── RUNNING — show timer + Stop ──────────────────────────────────────────
  if (phase === "running") return (
    <div style={{
      background:"var(--bg)", border:"1px solid var(--accent)",
      borderRadius:"var(--radius-lg)", padding:"20px", textAlign:"center",
    }}>
      {/* Digital timer */}
      <div style={{
        fontFamily:"'Courier New', monospace",
        fontSize:"52px", fontWeight:700, letterSpacing:"4px",
        color:"var(--accent)", lineHeight:1, marginBottom:"6px",
        textShadow:"0 0 20px rgba(0,229,255,0.4)",
      }}>
        {fmt(elapsed)}
      </div>
      <div style={{ fontSize:"12px", color:"var(--text3)", marginBottom:"18px" }}>
        Session in progress…
      </div>

      {/* Animated pulse ring */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:"18px" }}>
        <div style={{
          width:"10px", height:"10px", borderRadius:"50%",
          background:"var(--green)", boxShadow:"0 0 0 0 rgba(16,185,129,0.4)",
          animation:"ring-pulse 1.5s infinite",
        }}/>
        <style>{`
          @keyframes ring-pulse {
            0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.5); }
            70%  { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
            100% { box-shadow: 0 0 0 0   rgba(16,185,129,0); }
          }
        `}</style>
      </div>

      <div style={{ display:"flex", gap:"10px" }}>
        <button className="btn btn-danger" style={{ flex:1 }} onClick={cancelSession}>
          ✕ Discard
        </button>
        <button
          className="btn"
          style={{
            flex:2, background:"var(--green)", color:"#fff", fontWeight:700,
            boxShadow:"0 0 20px rgba(16,185,129,0.3)",
          }}
          onClick={stopSession}
        >
          ⏹ Stop & Submit
        </button>
      </div>
    </div>
  );

  // ── SUBMITTING — video proof upload modal ────────────────────────────────
  if (phase === "submitting") return (
    <div style={{
      background:"var(--surface)", border:"1px solid var(--border2)",
      borderRadius:"var(--radius-lg)", padding:"20px",
    }}>
      <div style={{ textAlign:"center", marginBottom:"16px" }}>
        <div style={{ fontFamily:"'Courier New',monospace", fontSize:"32px",
          fontWeight:700, color:"var(--green)", letterSpacing:"3px" }}>
          {fmt(elapsed)}
        </div>
        <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"2px" }}>
          Session duration
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type==="error"?"error":"success"}`}
          style={{ marginBottom:"12px" }}>{msg.text}</div>
      )}

      <div style={{ marginBottom:"14px" }}>
        <div style={{ fontSize:"13px", fontWeight:700, marginBottom:"6px" }}>
          📹 Upload Workout Video (optional)
        </div>
        <div style={{ fontSize:"11px", color:"var(--text3)", marginBottom:"10px" }}>
          Show your trainer what you did. MP4, MOV — max 100MB.
        </div>

        <label style={{
          display:"flex", flexDirection:"column", alignItems:"center", gap:"8px",
          padding:"20px", border:`2px dashed ${videoFile?"var(--green)":"var(--border2)"}`,
          borderRadius:"var(--radius)", cursor:"pointer",
          background: videoFile ? "rgba(16,185,129,0.05)" : "var(--bg3)",
          transition:"all 0.2s",
        }}>
          <span style={{ fontSize:"28px" }}>{videoFile ? "🎬" : "📁"}</span>
          <span style={{ fontSize:"13px", fontWeight:600, color:videoFile?"var(--green)":"var(--text2)" }}>
            {videoFile ? videoFile.name : "Click to upload video"}
          </span>
          {videoFile && (
            <span style={{ fontSize:"11px", color:"var(--text3)" }}>
              {(videoFile.size / 1024 / 1024).toFixed(1)} MB
            </span>
          )}
          <input type="file" accept="video/*" style={{ display:"none" }}
            onChange={handleFileChange} />
        </label>

        {/* Video preview */}
        {previewUrl && (
          <video src={previewUrl} controls style={{
            width:"100%", borderRadius:"var(--radius)", marginTop:"10px",
            maxHeight:"160px", background:"#000",
          }} />
        )}
      </div>

      <div style={{ display:"flex", gap:"10px" }}>
        <button className="btn btn-outline" style={{ flex:1 }} onClick={cancelSession}
          disabled={uploading}>
          Cancel
        </button>
        <button
          className="btn btn-accent"
          style={{ flex:2 }}
          onClick={submitSession}
          disabled={uploading}
        >
          {uploading
            ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Submitting…</>
            : "✅ Submit Session"}
        </button>
      </div>
    </div>
  );

  // ── DONE ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      textAlign:"center", padding:"20px",
      background:"rgba(16,185,129,0.06)",
      border:"1px solid rgba(16,185,129,0.3)", borderRadius:"var(--radius-lg)",
    }}>
      {msg.text && (
        <div className="alert alert-success" style={{ marginBottom:"12px" }}>{msg.text}</div>
      )}
      <div style={{ fontSize:"36px", marginBottom:"8px" }}>🔥</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px",
        color:"var(--green)", letterSpacing:"1px" }}>
        Session Complete!
      </div>
      <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"4px", marginBottom:"14px" }}>
        Duration: {fmt(elapsed)} · +15 FlexPoints earned
      </div>
      <button className="btn btn-outline btn-sm" onClick={cancelSession}>
        ↺ Start Another Session
      </button>
    </div>
  );
}

// ── Daily Workout View (exercise list) ───────────────────────────────────────
function DailyWorkoutView({ programId, token }) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [workout, setWorkout]           = useState(null);
  const [completion, setCompletion]     = useState(null);
  const [allWorkouts, setAllWorkouts]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [sessionDone, setSessionDone]   = useState(false);
  const [msg, setMsg]                   = useState({ type:"", text:"" });
  const { token: tkn } = useAuth();

  useEffect(() => {
    api.get(`/daily-workouts/client/${programId}`, { headers:{ Authorization:`Bearer ${tkn}` } })
      .then(r => setAllWorkouts(r.data.workouts || []))
      .catch(() => {});
  }, [programId, sessionDone]);

  useEffect(() => {
    setLoading(true); setWorkout(null); setCompletion(null); setMsg({type:"",text:""});
    api.get(`/daily-workouts/client/${programId}/day?date=${selectedDate}`, {
      headers:{ Authorization:`Bearer ${tkn}` },
    })
      .then(r => { setWorkout(r.data.workout||null); setCompletion(r.data.completion||null); })
      .catch(()=>{})
      .finally(() => setLoading(false));
  }, [selectedDate, programId, sessionDone]);

  if (loading) return (
    <div className="loading-screen" style={{minHeight:"100px"}}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div>
      {/* Date picker row */}
      <div style={{ display:"flex", gap:"8px", alignItems:"center",
        marginBottom:"14px", flexWrap:"wrap" }}>
        <input type="date" className="form-input" value={selectedDate}
          onChange={e=>setSelectedDate(e.target.value)}
          style={{ maxWidth:"160px" }} />
        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
          {allWorkouts.map(w => (
            <button key={w.date}
              className={`btn btn-sm ${selectedDate===w.date?"btn-primary":"btn-outline"}`}
              onClick={() => setSelectedDate(w.date)}
              style={{ fontSize:"10px", padding:"4px 8px" }}
            >
              {new Date(w.date+"T12:00:00").toLocaleDateString("en-US",
                { month:"short", day:"numeric" })}
            </button>
          ))}
        </div>
      </div>

      {!workout ? (
        <div className="empty-state" style={{padding:"24px"}}>
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">
            No workout assigned for this date yet.
          </div>
        </div>
      ) : (
        <div>
          {/* Workout header */}
          <div style={{ marginBottom:"14px" }}>
            <div style={{ fontWeight:700, fontSize:"15px", color:"var(--accent)",
              marginBottom:"3px" }}>
              {workout.title || `Workout — ${selectedDate}`}
            </div>
            {workout.notes && (
              <div style={{ fontSize:"12px", color:"var(--text2)" }}>📝 {workout.notes}</div>
            )}
          </div>

          {/* Exercise cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:"10px",
            marginBottom:"16px" }}>
            {workout.exercises.map((ex, i) => {
              const embed = getYTEmbed(ex.videoUrl);
              return (
                <div key={i} style={{
                  background:"var(--bg3)", border:"1px solid var(--border)",
                  borderRadius:"var(--radius)", padding:"14px",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start", marginBottom:"6px" }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:"14px" }}>{ex.name}</div>
                      {ex.notes && (
                        <div style={{ fontSize:"11px", color:"var(--text3)",
                          marginTop:"2px" }}>💬 {ex.notes}</div>
                      )}
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif",
                        fontSize:"20px", color:"var(--text)", lineHeight:1 }}>
                        {ex.sets}×{ex.reps}
                        {ex.weight > 0 && (
                          <span style={{ fontSize:"13px", color:"var(--text2)",
                            marginLeft:"4px" }}>@ {ex.weight}kg</span>
                        )}
                      </div>
                      <div style={{ fontSize:"10px", color:"var(--text3)" }}>
                        rest {ex.restSeconds}s
                      </div>
                    </div>
                  </div>
                  {embed && (
                    <div style={{ borderRadius:"8px", overflow:"hidden",
                      aspectRatio:"16/9", marginTop:"8px" }}>
                      <iframe src={embed} title={ex.name}
                        style={{ width:"100%", height:"100%", border:"none" }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen />
                    </div>
                  )}
                  {ex.videoUrl && !embed && (
                    <a href={ex.videoUrl} target="_blank" rel="noreferrer"
                      className="btn btn-outline btn-sm" style={{marginTop:"6px"}}>
                      ▶ Watch Video
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Session Tracker or Already Completed */}
          {completion ? (
            <div style={{
              background:"rgba(16,185,129,0.06)",
              border:"1px solid rgba(16,185,129,0.25)",
              borderRadius:"var(--radius)", padding:"14px",
            }}>
              <div style={{ fontWeight:700, color:"var(--green)",
                marginBottom:"8px" }}>
                ✓ Session Completed
              </div>
              <div style={{ display:"flex", gap:"16px", fontSize:"12px",
                color:"var(--text2)", flexWrap:"wrap" }}>
                {completion.duration > 0 && (
                  <span>⏱ {fmt(completion.duration)}</span>
                )}
                {completion.videoUrl && (
                  <a href={`${import.meta.env.VITE_API_URL?.replace("/api","") ||
                    "http://localhost:5000"}${completion.videoUrl}`}
                    target="_blank" rel="noreferrer"
                    style={{ color:"var(--accent2)" }}>
                    🎬 View Video
                  </a>
                )}
                <span>{new Date(completion.createdAt).toLocaleTimeString([],
                  {hour:"2-digit",minute:"2-digit"})}</span>
              </div>
            </div>
          ) : (
            <SessionTracker
              program={{ _id: programId }}
              token={tkn}
              onDone={() => setSessionDone(s => !s)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Progress Summary ─────────────────────────────────────────────────────────
function ProgressSummary({ programId, token }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    api.get(`/daily-workouts/client/${programId}/progress`, {
      headers:{ Authorization:`Bearer ${token}` },
    }).then(r => setProgress(r.data)).catch(()=>{});
  }, [programId]);

  if (!progress) return null;
  const pct = progress.percentage || 0;

  return (
    <div style={{
      background:"var(--bg3)", border:"1px solid var(--border)",
      borderRadius:"var(--radius)", padding:"14px", marginBottom:"14px",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:"6px" }}>
        <span style={{ fontWeight:700, fontSize:"13px" }}>Program Progress</span>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px",
          color:"var(--accent)" }}>{pct}%</span>
      </div>
      <div style={{ height:"6px", background:"var(--border)", borderRadius:"3px",
        overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`,
          background:"linear-gradient(90deg,var(--accent2),var(--accent))",
          borderRadius:"3px", transition:"width 0.5s" }}/>
      </div>
      <div style={{ display:"flex", gap:"16px", marginTop:"8px", fontSize:"11px",
        color:"var(--text3)" }}>
        <span><strong style={{color:"var(--green)"}}>{progress.completedCount}</strong> completed</span>
        <span><strong style={{color:"var(--text)"}}>{progress.totalWorkouts}</strong> total workouts</span>
      </div>
    </div>
  );
}

// ── Program Live Sessions ─────────────────────────────────────────────────────
function ProgramSessions({ programId, trainerId, token }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get("/sessions/for-me", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => {
        const all = r.data.sessions || [];
        const relevant = all.filter(s => {
          const mp = s.program && String(s.program?._id||s.program) === String(programId);
          const mt = s.trainer && (
            String(s.trainer?._id) === String(trainerId) ||
            String(s.trainer)      === String(trainerId)
          );
          return mp || mt;
        });
        setSessions(relevant.length > 0 ? relevant : all.filter(s =>
          String(s.trainer?._id||s.trainer) === String(trainerId)
        ));
      })
      .catch(()=>setSessions([]))
      .finally(()=>setLoading(false));
  }, [programId, trainerId]);

  if (loading) return (
    <div style={{padding:"16px",color:"var(--text3)",fontSize:"13px"}}>
      Loading sessions…
    </div>
  );
  if (sessions.length === 0) return (
    <div className="empty-state" style={{padding:"24px"}}>
      <div className="empty-state-icon">🎥</div>
      <div className="empty-state-text">
        No live sessions scheduled yet.
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      {sessions.map(s => (
        <div key={s._id} style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 14px",
          background: isLive(s) ? "rgba(16,185,129,0.08)" : "var(--bg3)",
          border: `1px solid ${isLive(s)?"var(--green)":"var(--border)"}`,
          borderRadius:"var(--radius)", gap:"12px",
        }}>
          <div>
            <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"3px"}}>
              <span style={{fontWeight:700,fontSize:"13px"}}>{s.title}</span>
              {isLive(s) && (
                <span className="tag tag-approved"
                  style={{animation:"pulse 1.5s infinite"}}>
                  🔴 LIVE
                </span>
              )}
            </div>
            <div style={{fontSize:"11px",color:"var(--text3)"}}>
              {formatDT(s.scheduledAt)} · {s.durationMinutes}min
              · by {s.trainer?.user?.name}
            </div>
          </div>
          <a href={s.meetingLink} target="_blank" rel="noreferrer"
            className={`btn btn-sm ${isLive(s)?"btn-accent":"btn-outline"}`}
            style={{flexShrink:0}}>
            {isLive(s) ? "Join Now 🚀" : "View Link"}
          </a>
        </div>
      ))}
    </div>
  );
}

// ── Progress Full History ──────────────────────────────────────────────────────
function ProgressFull({ programId, token }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/daily-workouts/client/${programId}/progress`, {
      headers:{ Authorization:`Bearer ${token}` },
    }).then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, [programId]);

  if (loading) return (
    <div className="loading-screen" style={{minHeight:"100px"}}>
      <div className="spinner"></div>
    </div>
  );
  if (!data || data.completions.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon">📊</div>
      <div className="empty-state-text">
        Complete sessions to see your progress here!
      </div>
    </div>
  );

  const pct = data.percentage || 0;
  const weights = data.completions.filter(c=>c.bodyWeight>0).map(c=>c.bodyWeight);
  const latestW = weights[weights.length-1];
  const firstW  = weights[0];
  const wDiff   = latestW && firstW ? (latestW-firstW).toFixed(1) : null;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
        gap:"10px", marginBottom:"16px" }}>
        <div className="stat-card">
          <div className="stat-card-value" style={{color:"var(--accent)",fontSize:"28px"}}>{pct}%</div>
          <div className="stat-card-label">Completion</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{color:"var(--green)",fontSize:"28px"}}>
            {data.completedCount}
          </div>
          <div className="stat-card-label">Sessions Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{
            color: wDiff !== null && Number(wDiff) < 0 ? "var(--green)" : "var(--gold)",
            fontSize:"28px",
          }}>
            {latestW ? `${latestW}kg` : "—"}
          </div>
          <div className="stat-card-label">
            {wDiff !== null ? `${Number(wDiff)>0?"+":""}${wDiff}kg change` : "Weight"}
          </div>
        </div>
      </div>

      <div style={{ height:"6px", background:"var(--border)", borderRadius:"3px",
        overflow:"hidden", marginBottom:"16px" }}>
        <div style={{ height:"100%", width:`${pct}%`,
          background:"linear-gradient(90deg,var(--accent2),var(--accent))",
          borderRadius:"3px" }}/>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        {[...data.completions].reverse().map((c,i) => (
          <div key={c._id||i} style={{
            background:"var(--bg3)", border:"1px solid var(--border)",
            borderRadius:"var(--radius)", padding:"12px 14px",
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <div>
              <div style={{fontSize:"12px",color:"var(--text3)"}}>
                {new Date((c.date||"")+"T12:00:00").toLocaleDateString("en-US",
                  {weekday:"short",month:"short",day:"numeric"})}
              </div>
              <div style={{display:"flex",gap:"8px",marginTop:"4px",flexWrap:"wrap"}}>
                {c.duration > 0 && (
                  <span className="spec-tag" style={{fontSize:"10px"}}>
                    ⏱ {fmt(c.duration)}
                  </span>
                )}
                {c.sessionType === "session_tracker" && (
                  <span className="spec-tag" style={{fontSize:"10px",
                    color:"var(--accent2)"}}>
                    📱 Tracker
                  </span>
                )}
                {c.completedExercises?.map((ex,ei) => (
                  <span key={ei} className="spec-tag" style={{fontSize:"10px"}}>
                    {ex.name}
                  </span>
                ))}
              </div>
              {c.notes && (
                <div style={{fontSize:"11px",color:"var(--text3)",marginTop:"3px"}}>
                  {c.notes}
                </div>
              )}
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              {c.bodyWeight > 0 && (
                <div style={{fontFamily:"'Bebas Neue',sans-serif",
                  fontSize:"20px",color:"var(--accent)"}}>
                  {c.bodyWeight}kg
                </div>
              )}
              {c.videoUrl && (
                <a href={`${import.meta.env.VITE_API_URL?.replace("/api","") ||
                  "http://localhost:5000"}${c.videoUrl}`}
                  target="_blank" rel="noreferrer"
                  style={{fontSize:"11px",color:"var(--accent2)"}}>
                  🎬 Video
                </a>
              )}
              <span className="tag tag-approved" style={{display:"block",
                fontSize:"10px",marginTop:"3px"}}>✓ Done</span>
            </div>
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
  const [loading, setLoading]         = useState(true);
  const [activeEnrollment, setActiveEnrollment] = useState(null);
  const [activeTab, setActiveTab]     = useState("workout");

  useEffect(() => {
    api.get("/programs/enrolled", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => {
        const enrs = r.data.enrollments || [];
        setEnrollments(enrs);
        if (enrs.length > 0) setActiveEnrollment(enrs[0]);
      })
      .catch(()=>{})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="card loading-screen" style={{minHeight:"200px"}}>
      <div className="spinner"></div>
    </div>
  );

  if (enrollments.length === 0) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <div className="empty-state-text">
          You haven't registered for any programs yet.
          Browse the marketplace to find one!
        </div>
      </div>
    </div>
  );

  const program = activeEnrollment?.program;
  const trainer = program?.trainer;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

      {/* Program selector tabs */}
      {enrollments.length > 1 && (
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          {enrollments.map(e => (
            <button key={e._id}
              className={`btn btn-sm ${activeEnrollment?._id===e._id?"btn-primary":"btn-outline"}`}
              onClick={() => { setActiveEnrollment(e); setActiveTab("workout"); }}
            >
              {e.program?.title}
            </button>
          ))}
        </div>
      )}

      {program && (
        <>
          {/* Program hero */}
          <div className="card" style={{padding:"18px"}}>
            <div style={{display:"flex",gap:"14px",alignItems:"flex-start",
              marginBottom:"12px"}}>
              <div className="trainer-avatar" style={{width:"50px",height:"50px",
                fontSize:"20px",borderRadius:"14px",flexShrink:0}}>
                {(trainer?.user?.name||"T")[0].toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:"17px",marginBottom:"2px"}}>
                  {program.title}
                </div>
                <div style={{fontSize:"12px",color:"var(--text2)",marginBottom:"6px"}}>
                  by {trainer?.user?.name} · {program.durationWeeks}w program
                </div>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                  <span className="tag tag-active"
                    style={{textTransform:"capitalize"}}>
                    {program.category?.replace("_"," ")}
                  </span>
                  <span className="tag tag-approved">✓ Enrolled</span>
                  <span style={{fontSize:"11px",color:"var(--text3)",
                    alignSelf:"center"}}>
                    Since {new Date(activeEnrollment.createdAt)
                      .toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                  </span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",
                  color:"var(--gold)",lineHeight:1}}>
                  ₹{activeEnrollment.amountPaid}
                </div>
                <div style={{fontSize:"11px",color:"var(--text3)"}}>paid</div>
              </div>
            </div>
          </div>

          {/* Content tabs */}
          <div className="card">
            <div className="tabs" style={{marginBottom:"18px"}}>
              <button
                className={`tab-btn ${activeTab==="workout"?"active":""}`}
                onClick={()=>setActiveTab("workout")}
              >🏋️ Today's Workout</button>
              <button
                className={`tab-btn ${activeTab==="progress"?"active":""}`}
                onClick={()=>setActiveTab("progress")}
              >📈 My Progress</button>
              <button
                className={`tab-btn ${activeTab==="sessions"?"active":""}`}
                onClick={()=>setActiveTab("sessions")}
              >🎥 Live Sessions</button>
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