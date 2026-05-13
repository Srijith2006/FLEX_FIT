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
// Returns today's date as "YYYY-MM-DD" in local time
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
// Full URL for a server-relative video path
function videoUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5000"}${path}`;
}

// ── Session Tracker ───────────────────────────────────────────────────────────
function SessionTracker({ program, token, onDone }) {
  const [phase, setPhase]       = useState("idle");
  const [elapsed, setElapsed]   = useState(0);
  const [videoFile, setVideo]   = useState(null);
  const [uploading, setUp]      = useState(false);
  const [msg, setMsg]           = useState({ type:"", text:"" });
  const [previewUrl, setPreview] = useState(null);
  const [doneData, setDoneData] = useState(null);
  const intervalRef = useRef(null);
  const startRef    = useRef(null);

  const startSession = () => {
    setElapsed(0); setPhase("running");
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
  };

  const stopSession = () => {
    clearInterval(intervalRef.current);
    setPhase("submitting");
  };

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
    setPreview(f.type.startsWith("video/") ? URL.createObjectURL(f) : null);
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
        headers: { Authorization: `Bearer ${token}` },
      });

      const completion = res.data.completion || res.data;
      setDoneData({ elapsed, videoFile, completion });
      setMsg({ type:"success", text: res.data.message || "Session saved! 🔥" });
      setPhase("done");
      onDone?.(completion);
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Submission failed." });
    } finally { setUp(false); }
  };

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (phase === "idle") return (
    <button className="btn btn-accent btn-full" style={{ fontSize:"14px", padding:"12px" }}
      onClick={startSession}>
      ▶ Start Session
    </button>
  );

  // ── RUNNING ───────────────────────────────────────────────────────────────
  if (phase === "running") return (
    <div style={{ background:"var(--bg)", border:"1px solid var(--accent)",
      borderRadius:"var(--radius-lg)", padding:"20px", textAlign:"center" }}>
      <div style={{ fontFamily:"'Courier New', monospace", fontSize:"52px", fontWeight:700,
        letterSpacing:"4px", color:"var(--accent)", lineHeight:1, marginBottom:"6px",
        textShadow:"0 0 20px rgba(0,229,255,0.4)" }}>
        {fmt(elapsed)}
      </div>
      <div style={{ fontSize:"12px", color:"var(--text3)", marginBottom:"18px" }}>
        Session in progress…
      </div>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:"18px" }}>
        <div style={{ width:"10px", height:"10px", borderRadius:"50%",
          background:"var(--green)", boxShadow:"0 0 0 0 rgba(16,185,129,0.4)",
          animation:"ring-pulse 1.5s infinite" }}/>
        <style>{`
          @keyframes ring-pulse {
            0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.5); }
            70%  { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
            100% { box-shadow: 0 0 0 0   rgba(16,185,129,0); }
          }
        `}</style>
      </div>
      <div style={{ display:"flex", gap:"10px" }}>
        <button className="btn btn-danger" style={{ flex:1 }} onClick={cancelSession}>✕ Discard</button>
        <button className="btn" style={{ flex:2, background:"var(--green)", color:"#fff",
          fontWeight:700, boxShadow:"0 0 20px rgba(16,185,129,0.3)" }} onClick={stopSession}>
          ⏹ Stop & Submit
        </button>
      </div>
    </div>
  );

  // ── SUBMITTING ────────────────────────────────────────────────────────────
  if (phase === "submitting") return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border2)",
      borderRadius:"var(--radius-lg)", padding:"20px" }}>
      <div style={{ textAlign:"center", marginBottom:"16px" }}>
        <div style={{ fontFamily:"'Courier New',monospace", fontSize:"32px",
          fontWeight:700, color:"var(--green)", letterSpacing:"3px" }}>
          {fmt(elapsed)}
        </div>
        <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"2px" }}>Session duration</div>
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
        <label style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"8px",
          padding:"20px", border:`2px dashed ${videoFile?"var(--green)":"var(--border2)"}`,
          borderRadius:"var(--radius)", cursor:"pointer",
          background: videoFile ? "rgba(16,185,129,0.05)" : "var(--bg3)", transition:"all 0.2s" }}>
          <span style={{ fontSize:"28px" }}>{videoFile ? "🎬" : "📁"}</span>
          <span style={{ fontSize:"13px", fontWeight:600, color:videoFile?"var(--green)":"var(--text2)" }}>
            {videoFile ? videoFile.name : "Click to upload video"}
          </span>
          {videoFile && (
            <span style={{ fontSize:"11px", color:"var(--text3)" }}>
              {(videoFile.size / 1024 / 1024).toFixed(1)} MB
            </span>
          )}
          <input type="file" accept="video/*" style={{ display:"none" }} onChange={handleFileChange} />
        </label>
        {previewUrl && (
          <video src={previewUrl} controls style={{ width:"100%", borderRadius:"var(--radius)",
            marginTop:"10px", maxHeight:"160px", background:"#000" }} />
        )}
      </div>

      <div style={{ display:"flex", gap:"10px" }}>
        <button className="btn btn-outline" style={{ flex:1 }} onClick={cancelSession} disabled={uploading}>
          Cancel
        </button>
        <button className="btn btn-accent" style={{ flex:2 }} onClick={submitSession} disabled={uploading}>
          {uploading
            ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Submitting…</>
            : "✅ Submit Session"}
        </button>
      </div>
    </div>
  );

  // ── DONE ──────────────────────────────────────────────────────────────────
  const d = doneData || {};
  return (
    <div style={{ padding:"24px", background:"rgba(16,185,129,0.06)",
      border:"2px solid rgba(16,185,129,0.4)", borderRadius:"var(--radius-lg)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"16px" }}>
        <div style={{ width:"48px", height:"48px", borderRadius:"50%", flexShrink:0,
          background:"rgba(16,185,129,0.15)", border:"2px solid var(--green)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px" }}>✅</div>
        <div>
          <div style={{ fontWeight:800, fontSize:"18px", color:"var(--green)" }}>Session Submitted!</div>
          <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"2px" }}>Your trainer has been notified</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"16px" }}>
        {[
          { icon:"⏱", label:"Duration", value: fmt(d.elapsed||0),              color:"var(--gold)"    },
          { icon:"🎬", label:"Proof",    value: d.videoFile ? "Video ✓" : "No video",
            color: d.videoFile ? "var(--green)" : "var(--text3)" },
          { icon:"⚡", label:"Points",   value: "+15 pts",                      color:"var(--accent2)" },
        ].map(s => (
          <div key={s.label} style={{ textAlign:"center", padding:"10px",
            background:"var(--bg3)", borderRadius:"10px" }}>
            <div style={{ fontSize:"18px" }}>{s.icon}</div>
            <div style={{ fontWeight:700, fontSize:"15px", color:s.color, marginTop:"2px" }}>{s.value}</div>
            <div style={{ fontSize:"10px", color:"var(--text3)", textTransform:"uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px",
        background:"rgba(0,112,243,0.08)", borderRadius:"10px", border:"1px solid rgba(0,112,243,0.2)" }}>
        <span style={{ fontSize:"16px" }}>👨‍🏫</span>
        <div style={{ fontSize:"12px", color:"var(--accent2)" }}>
          <strong>Sent to your trainer</strong> — they can review your session and video proof
        </div>
      </div>
    </div>
  );
}

// ── Already-submitted badge ───────────────────────────────────────────────────
function SessionSubmittedBadge({ completion }) {
  return (
    <div style={{ padding:"16px 20px", background:"rgba(16,185,129,0.07)",
      border:"2px solid var(--green)", borderRadius:"var(--radius-lg)",
      display:"flex", alignItems:"center", gap:"14px" }}>
      <div style={{ width:"42px", height:"42px", borderRadius:"50%", flexShrink:0,
        background:"rgba(16,185,129,0.15)", border:"2px solid var(--green)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>✅</div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:"15px", color:"var(--green)" }}>
          ✅ Session Completed Today
        </div>
        <div style={{ fontSize:"12px", color:"var(--text3)", marginTop:"3px", display:"flex", gap:"12px", flexWrap:"wrap" }}>
          {completion?.duration > 0 && <span>⏱ {fmt(completion.duration)}</span>}
          {completion?.videoUrl  && (
            <a href={videoUrl(completion.videoUrl)} target="_blank" rel="noreferrer"
              style={{ color:"var(--accent2)" }}>🎬 View Video</a>
          )}
          <span>{new Date(completion?.createdAt||Date.now()).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
        </div>
      </div>
    </div>
  );
}

// ── Daily Workout View ────────────────────────────────────────────────────────
function DailyWorkoutView({ programId, token }) {
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState(today);
  const [workout, setWorkout]           = useState(null);
  const [allWorkouts, setAllWorkouts]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [todayDone, setTodayDone]       = useState(false);
  const [todayCompletion, setTodayCompletion] = useState(null);
  const [sessionDone, setSessionDone]   = useState(false);
  const { token: tkn } = useAuth();

  useEffect(() => {
    api.get(`/daily-workouts/client/${programId}/day?date=${today}`, {
      headers: { Authorization: `Bearer ${tkn}` },
    }).then(r => {
      const c = r.data.completion || null;
      if (c && (c.sessionType === "session_tracker" || c.duration > 0)) {
        setTodayDone(true);
        setTodayCompletion(c);
      }
    }).catch(() => {});
  }, [programId, tkn, sessionDone]);

  useEffect(() => {
    api.get(`/daily-workouts/client/${programId}`, { headers:{ Authorization:`Bearer ${tkn}` } })
      .then(r => setAllWorkouts(r.data.workouts || []))
      .catch(() => {});
  }, [programId, sessionDone]);

  useEffect(() => {
    setLoading(true); setWorkout(null);
    api.get(`/daily-workouts/client/${programId}/day?date=${selectedDate}`, {
      headers: { Authorization: `Bearer ${tkn}` },
    })
      .then(r => setWorkout(r.data.workout || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedDate, programId, sessionDone]);

  const handleSessionDone = (completion) => {
    setTodayDone(true);
    setTodayCompletion(completion);
    setSessionDone(s => !s);
  };

  if (loading) return (
    <div className="loading-screen" style={{minHeight:"100px"}}><div className="spinner"/></div>
  );

  return (
    <div>
      <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"14px", flexWrap:"wrap" }}>
        <input type="date" className="form-input" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)} style={{ maxWidth:"160px" }} />
        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
          {allWorkouts.map(w => (
            <button key={w.date}
              className={`btn btn-sm ${selectedDate===w.date?"btn-primary":"btn-outline"}`}
              onClick={() => setSelectedDate(w.date)}
              style={{ fontSize:"10px", padding:"4px 8px" }}>
              {new Date(w.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}
            </button>
          ))}
        </div>
      </div>

      {!workout ? (
        <div className="empty-state" style={{padding:"24px"}}>
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">No workout assigned for this date yet.</div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom:"14px" }}>
            <div style={{ fontWeight:700, fontSize:"15px", color:"var(--accent)", marginBottom:"3px" }}>
              {workout.title || `Workout — ${selectedDate}`}
            </div>
            {workout.notes && <div style={{ fontSize:"12px", color:"var(--text2)" }}>📝 {workout.notes}</div>}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"16px" }}>
            {workout.exercises.map((ex, i) => {
              const embed = getYTEmbed(ex.videoUrl);
              return (
                <div key={i} style={{ background:"var(--bg3)", border:"1px solid var(--border)",
                  borderRadius:"var(--radius)", padding:"14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start", marginBottom:"6px" }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:"14px" }}>{ex.name}</div>
                      {ex.notes && (
                        <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>💬 {ex.notes}</div>
                      )}
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px",
                        color:"var(--text)", lineHeight:1 }}>
                        {ex.sets}×{ex.reps}
                        {ex.weight > 0 && (
                          <span style={{ fontSize:"13px", color:"var(--text2)", marginLeft:"4px" }}>
                            @ {ex.weight}kg
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:"10px", color:"var(--text3)" }}>rest {ex.restSeconds}s</div>
                    </div>
                  </div>
                  {embed && (
                    <div style={{ borderRadius:"8px", overflow:"hidden", aspectRatio:"16/9", marginTop:"8px" }}>
                      <iframe src={embed} title={ex.name}
                        style={{ width:"100%", height:"100%", border:"none" }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen />
                    </div>
                  )}
                  {ex.videoUrl && !embed && (
                    <a href={ex.videoUrl} target="_blank" rel="noreferrer"
                      className="btn btn-outline btn-sm" style={{marginTop:"6px"}}>▶ Watch Video</a>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDate === today ? (
            todayDone
              ? <SessionSubmittedBadge completion={todayCompletion} />
              : <SessionTracker program={{ _id: programId }} token={tkn} onDone={handleSessionDone} />
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Progress Summary bar ──────────────────────────────────────────────────────
function ProgressSummary({ programId, token }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/daily-workouts/client/${programId}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setData(r.data)).catch(() => {});
  }, [programId]);

  if (!data) return null;

  const sessionCompletions = (data.completions || []).filter(
    c => c.sessionType === "session_tracker" || c.duration > 0
  );
  const totalDays    = data.totalWorkouts || 1;
  const doneSessions = sessionCompletions.length;
  const pct = Math.min(100, Math.round((doneSessions / totalDays) * 100));

  return (
    <div style={{ background:"var(--bg3)", border:"1px solid var(--border)",
      borderRadius:"var(--radius)", padding:"14px", marginBottom:"14px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
        <span style={{ fontWeight:700, fontSize:"13px" }}>Program Progress</span>
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"var(--accent)" }}>{pct}%</span>
      </div>
      <div style={{ height:"6px", background:"var(--border)", borderRadius:"3px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`,
          background:"linear-gradient(90deg,var(--accent2),var(--accent))",
          borderRadius:"3px", transition:"width 0.5s" }}/>
      </div>
      <div style={{ display:"flex", gap:"16px", marginTop:"8px", fontSize:"11px", color:"var(--text3)" }}>
        <span><strong style={{color:"var(--green)"}}>{doneSessions}</strong> sessions done</span>
        <span><strong style={{color:"var(--text)"}}>{totalDays}</strong> total days</span>
      </div>
    </div>
  );
}

// ── Program Live Sessions ─────────────────────────────────────────────────────
// FIX: Replaced the broken /sessions/for-me endpoint + fragile client-side
//      filter with a direct /sessions/program/:programId call.
//      The old approach silently returned [] because:
//        1. /sessions/for-me only returned isOpenToAll:true sessions on the backend
//        2. Even if data existed, s.program?._id could be undefined if the
//           backend didn't populate the program field
//        3. The trainerId fallback filter was also unreliable due to ID type mismatches
// ─────────────────────────────────────────────────────────────────────────────
function ProgramSessions({ programId, token }) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    // ✅ FIX: fetch sessions scoped directly to this program.
    //    Backend must verify the requesting client is enrolled in programId.
    //    See backend fix note at bottom of this file.
    api.get(`/sessions/program/${programId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setSessions(r.data.sessions || []))
      .catch(() => {
        setError("Could not load sessions. Please try again.");
        setSessions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [programId]);

  if (loading) return (
    <div style={{ padding:"16px", color:"var(--text3)", fontSize:"13px",
      display:"flex", alignItems:"center", gap:"8px" }}>
      <div className="spinner" style={{ width:"16px", height:"16px" }} />
      Loading sessions…
    </div>
  );

  if (error) return (
    <div style={{ padding:"16px" }}>
      <div className="alert alert-error" style={{ marginBottom:"10px" }}>{error}</div>
      <button className="btn btn-outline btn-sm" onClick={load}>↻ Retry</button>
    </div>
  );

  if (sessions.length === 0) return (
    <div className="empty-state" style={{ padding:"24px" }}>
      <div className="empty-state-icon">🎥</div>
      <div className="empty-state-text">No live sessions scheduled yet.</div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {sessions.map(s => (
        <div
          key={s._id}
          style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 14px",
            background: isLive(s) ? "rgba(16,185,129,0.08)" : "var(--bg3)",
            border:`1px solid ${isLive(s) ? "var(--green)" : "var(--border)"}`,
            borderRadius:"var(--radius)",
            gap:"12px",
            transition:"border-color 0.2s",
          }}
        >
          <div style={{ flex:1, minWidth:0 }}>
            {/* Title + live badge */}
            <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"3px", flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:"13px" }}>{s.title}</span>
              {isLive(s) && (
                <span className="tag tag-approved" style={{ animation:"pulse 1.5s infinite" }}>
                  🔴 LIVE
                </span>
              )}
            </div>
            {/* Time + duration + trainer */}
            <div style={{ fontSize:"11px", color:"var(--text3)", marginBottom:"2px" }}>
              {formatDT(s.scheduledAt)} · {s.durationMinutes}min
              {s.trainer?.user?.name && ` · by ${s.trainer.user.name}`}
            </div>
            {s.description && (
              <div style={{ fontSize:"11px", color:"var(--text2)", marginTop:"2px" }}>
                {s.description}
              </div>
            )}
          </div>
          {/* Join / View link */}
          <a
            href={s.meetingLink}
            target="_blank"
            rel="noreferrer"
            className={`btn btn-sm ${isLive(s) ? "btn-accent" : "btn-outline"}`}
            style={{ flexShrink:0 }}
          >
            {isLive(s) ? "Join Now 🚀" : "View Link"}
          </a>
        </div>
      ))}
    </div>
  );
}

// ── Progress Full ─────────────────────────────────────────────────────────────
function ProgressFull({ programId, token, programTitle }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/daily-workouts/client/${programId}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [programId]);

  if (loading) return (
    <div className="loading-screen" style={{minHeight:"100px"}}><div className="spinner"/></div>
  );
  if (!data) return (
    <div className="empty-state">
      <div className="empty-state-icon">📊</div>
      <div className="empty-state-text">Complete sessions to see your progress here!</div>
    </div>
  );

  const sessions = (data.completions || [])
    .filter(c => c.sessionType === "session_tracker" || c.duration > 0)
    .slice()
    .reverse();

  const totalDays    = data.totalWorkouts || 1;
  const doneSessions = sessions.length;
  const pct          = Math.min(100, Math.round((doneSessions / totalDays) * 100));

  const totalSeconds = sessions.reduce((s, c) => s + (c.duration || 0), 0);
  const avgSeconds   = doneSessions > 0 ? Math.round(totalSeconds / doneSessions) : 0;
  const withVideo    = sessions.filter(c => c.videoUrl).length;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"16px" }}>
        <div className="stat-card">
          <div className="stat-card-value" style={{color:"var(--accent)",fontSize:"28px"}}>{pct}%</div>
          <div className="stat-card-label">Completion</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{color:"var(--green)",fontSize:"28px"}}>{doneSessions}</div>
          <div className="stat-card-label">Sessions Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{color:"var(--gold)",fontSize:"28px"}}>{fmt(avgSeconds)}</div>
          <div className="stat-card-label">Avg Duration</div>
        </div>
      </div>

      <div style={{ marginBottom:"20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px",
          color:"var(--text3)", marginBottom:"6px" }}>
          <span>{doneSessions} of {totalDays} sessions completed</span>
          <span>{withVideo} video{withVideo!==1?"s":""} submitted</span>
        </div>
        <div style={{ height:"8px", background:"var(--border)", borderRadius:"4px", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`,
            background:"linear-gradient(90deg,var(--accent2),var(--green))",
            borderRadius:"4px", transition:"width 0.5s" }}/>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏋️</div>
          <div className="empty-state-text">No sessions tracked yet. Start your first session!</div>
        </div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr 1fr",
            gap:"8px", padding:"8px 14px", fontSize:"10px", fontWeight:700,
            color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.5px",
            borderBottom:"1px solid var(--border)", marginBottom:"6px" }}>
            <span>Date</span>
            <span>Program</span>
            <span>Duration</span>
            <span>Proof</span>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {sessions.map((c, i) => (
              <div key={c._id||i} style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr 1fr",
                gap:"8px", padding:"12px 14px", alignItems:"center",
                background:"var(--bg3)", border:"1px solid var(--border)",
                borderRadius:"var(--radius)", transition:"border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor="var(--border2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>

                <div>
                  <div style={{ fontWeight:700, fontSize:"13px" }}>
                    {new Date((c.date||"")+"T12:00:00").toLocaleDateString("en-IN",
                      {day:"numeric",month:"short"})}
                  </div>
                  <div style={{ fontSize:"10px", color:"var(--text3)" }}>
                    {new Date((c.date||"")+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short"})}
                  </div>
                </div>

                <div style={{ fontSize:"12px", color:"var(--text2)", fontWeight:600,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {programTitle || "—"}
                </div>

                <div style={{ fontFamily:"'Courier New',monospace", fontWeight:700,
                  fontSize:"14px", color:"var(--gold)" }}>
                  {c.duration > 0 ? fmt(c.duration) : "—"}
                </div>

                <div>
                  {c.videoUrl ? (
                    <a href={videoUrl(c.videoUrl)} target="_blank" rel="noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:"4px",
                        fontSize:"11px", fontWeight:700, color:"var(--accent2)",
                        textDecoration:"none", padding:"4px 8px",
                        background:"rgba(0,112,243,0.1)", borderRadius:"6px",
                        border:"1px solid rgba(0,112,243,0.2)" }}>
                      🎬 View
                    </a>
                  ) : (
                    <span style={{ fontSize:"11px", color:"var(--text3)" }}>No video</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MyRegisteredPrograms() {
  const { token } = useAuth();
  const [enrollments, setEnrollments]           = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [activeEnrollment, setActiveEnrollment] = useState(null);
  const [activeTab, setActiveTab]               = useState("workout");

  useEffect(() => {
    api.get("/programs/enrolled", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => {
        const enrs = (r.data.enrollments || []).filter(e => e.program && e.program._id);
        setEnrollments(enrs);
        if (enrs.length > 0) setActiveEnrollment(enrs[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="card loading-screen" style={{minHeight:"200px"}}><div className="spinner"/></div>
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
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

      {/* Program selector tabs */}
      {enrollments.length > 1 && (
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          {enrollments.map(e => (
            e.program?.title ? (
              <button key={e._id}
                className={`btn btn-sm ${activeEnrollment?._id===e._id?"btn-primary":"btn-outline"}`}
                onClick={() => { setActiveEnrollment(e); setActiveTab("workout"); }}>
                {e.program.title}
              </button>
            ) : null
          ))}
        </div>
      )}

      {program && (
        <>
          {/* Program hero */}
          <div className="card" style={{padding:"18px"}}>
            <div style={{display:"flex",gap:"14px",alignItems:"flex-start",marginBottom:"12px"}}>
              <div className="trainer-avatar" style={{width:"50px",height:"50px",
                fontSize:"20px",borderRadius:"14px",flexShrink:0}}>
                {(trainer?.user?.name||"T")[0].toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:"17px",marginBottom:"2px"}}>{program.title}</div>
                <div style={{fontSize:"12px",color:"var(--text2)",marginBottom:"6px"}}>
                  by {trainer?.user?.name} · {program.durationWeeks}w program
                </div>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                  <span className="tag tag-active" style={{textTransform:"capitalize"}}>
                    {program.category?.replace("_"," ")}
                  </span>
                  <span className="tag tag-approved">✓ Enrolled</span>
                  <span style={{fontSize:"11px",color:"var(--text3)",alignSelf:"center"}}>
                    Since {new Date(activeEnrollment.createdAt)
                      .toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                  </span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",
                  color:"var(--gold)",lineHeight:1}}>₹{activeEnrollment.amountPaid}</div>
                <div style={{fontSize:"11px",color:"var(--text3)"}}>paid</div>
              </div>
            </div>
          </div>

          {/* Content tabs */}
          <div className="card">
            <div className="tabs" style={{marginBottom:"18px"}}>
              <button className={`tab-btn ${activeTab==="workout"?"active":""}`}
                onClick={()=>setActiveTab("workout")}>🏋️ Today's Workout</button>
              <button className={`tab-btn ${activeTab==="progress"?"active":""}`}
                onClick={()=>setActiveTab("progress")}>📈 My Progress</button>
              <button className={`tab-btn ${activeTab==="sessions"?"active":""}`}
                onClick={()=>setActiveTab("sessions")}>🎥 Live Sessions</button>
            </div>

            {activeTab === "workout" && (
              <>
                <ProgressSummary programId={program._id} token={token} />
                <DailyWorkoutView programId={program._id} token={token} />
              </>
            )}
            {activeTab === "progress" && (
              <ProgressFull
                programId={program._id}
                token={token}
                programTitle={program.title}
              />
            )}
            {activeTab === "sessions" && (
              // ✅ FIX: removed trainerId prop — no longer needed since
              //    ProgramSessions now fetches by programId directly
              <ProgramSessions
                programId={program._id}
                token={token}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// REQUIRED BACKEND CHANGE
// Add this route to your Express sessions router (e.g. routes/sessions.js)
// =============================================================================
//
// router.get("/program/:programId", protect, async (req, res) => {
//   try {
//     const { programId } = req.params;
//
//     // For clients: verify they are enrolled in this program
//     if (req.user.role === "client") {
//       const enrollment = await Enrollment.findOne({
//         program: programId,
//         client:  req.user.clientProfile,  // adjust to your field name
//       });
//       if (!enrollment) {
//         return res.status(403).json({ message: "Not enrolled in this program." });
//       }
//     }
//
//     const sessions = await Session.find({ program: programId })
//       .populate({ path: "trainer", populate: { path: "user", select: "name email" } })
//       .sort({ scheduledAt: 1 });
//
//     res.json({ sessions });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error." });
//   }
// });
//
// =============================================================================