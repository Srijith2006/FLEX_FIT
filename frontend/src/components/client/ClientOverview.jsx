import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const GOAL_CONFIG = {
  lose:        { label:"Weight Loss",  color:"#ef4444", bg:"rgba(239,68,68,0.08)"   },
  gain:        { label:"Muscle Gain",  color:"#10b981", bg:"rgba(16,185,129,0.08)"  },
  maintain:    { label:"Maintenance",  color:"#0070f3", bg:"rgba(0,112,243,0.08)"   },
  endurance:   { label:"Endurance",    color:"#f59e0b", bg:"rgba(245,158,11,0.08)"  },
  flexibility: { label:"Flexibility",  color:"#8b5cf6", bg:"rgba(139,92,246,0.08)"  },
};

// ── Thin arc ring ─────────────────────────────────────────────────────────────
function Arc({ pct, size = 72, stroke = 5, color = "var(--accent)", children }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" style={{ transition:"stroke-dasharray 0.8s ease" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex",
        flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {children}
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"6px",
      padding:"5px 12px", borderRadius:"6px",
      background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
      <span style={{ fontWeight:700, fontSize:"13px", color }}>{value}</span>
      <span style={{ fontSize:"11px", color:"var(--text3)", letterSpacing:"0.3px" }}>{label}</span>
    </div>
  );
}

// ── Quick action row item ─────────────────────────────────────────────────────
function Action({ icon, label, sub, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:"12px",
        padding:"13px 16px", borderRadius:"10px",
        border:`1px solid ${hov ? color+"55" : "rgba(255,255,255,0.06)"}`,
        background: hov ? `${color}10` : "rgba(255,255,255,0.02)",
        cursor:"pointer", flex:1, minWidth:"140px",
        transition:"all 0.15s", textAlign:"left",
      }}>
      <div style={{ width:"34px", height:"34px", borderRadius:"8px", flexShrink:0,
        background:`${color}15`, border:`1px solid ${color}30`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight:600, fontSize:"13px", color:"var(--text)", lineHeight:1.2 }}>{label}</div>
        {sub && <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>{sub}</div>}
      </div>
    </button>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({ title, action, onAction }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      marginBottom:"12px" }}>
      <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)",
        textTransform:"uppercase", letterSpacing:"1.2px" }}>
        {title}
      </div>
      {action && (
        <button onClick={onAction} style={{ fontSize:"11px", color:"var(--accent)",
          background:"none", border:"none", cursor:"pointer", fontWeight:600,
          letterSpacing:"0.2px" }}>
          {action}
        </button>
      )}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
const Div = () => (
  <div style={{ height:"1px", background:"rgba(255,255,255,0.05)", margin:"0" }} />
);

export default function ClientOverview({ onNavigate }) {
  const { token } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, logsRes, enrollRes, dietRes, pointsRes] = await Promise.all([
          api.get("/clients/me",             { headers:{ Authorization:`Bearer ${token}` } }),
          api.get("/workouts/logs/mine",      { headers:{ Authorization:`Bearer ${token}` } }),
          api.get("/programs/enrolled",       { headers:{ Authorization:`Bearer ${token}` } }),
          api.get("/diet-plans/client-plans", { headers:{ Authorization:`Bearer ${token}` } }).catch(() => ({ data:{ plans:[] } })),
          api.get("/rewards/points",          { headers:{ Authorization:`Bearer ${token}` } }).catch(() => ({ data:{ flexPoints:0, lifetimePoints:0 } })),
        ]);

        const client      = profileRes.data.client;
        const logs        = logsRes.data.logs || [];
        const enrollments = enrollRes.data.enrollments || [];

        const logDates = new Set(logs.map(l => new Date(l.date||l.createdAt).toISOString().split("T")[0]));
        let streak = 0;
        const d = new Date();
        while (logDates.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate()-1); }

        const weights      = logs.filter(l => l.weight > 0).map(l => l.weight);
        const latestWeight = weights[0] ?? client.currentWeight ?? 0;
        const firstWeight  = weights[weights.length-1] ?? latestWeight;
        const weightChange = latestWeight && firstWeight ? +(latestWeight - firstWeight).toFixed(1) : null;

        const dayIdx    = new Date().getDay();
        const todayIdx  = dayIdx === 0 ? 6 : dayIdx - 1;
        const dietPlan  = dietRes.data.plans?.[0] || null;
        const todayDiet = dietPlan?.days?.[todayIdx] || null;

        setStats({
          streak, totalLogs:logs.length, activePrograms:enrollments.length,
          currentWeight: latestWeight || client.currentWeight || 0,
          targetWeight:  client.targetWeight || 0,
          goalType:      client.goalType || "maintain",
          fitnessLevel:  client.fitnessLevel || "beginner",
          weightChange,
          recentLogs:    logs.slice(0,3),
          enrollments,
          profileComplete: !!(client.age && client.gender && client.height && client.currentWeight),
          dietPlan, todayDiet,
          flexPoints:     pointsRes.data.flexPoints || 0,
          lifetimePoints: pointsRes.data.lifetimePoints || 0,
          loggedToday:    logDates.has(new Date().toISOString().split("T")[0]),
          name:           client.user?.name || "",
        });
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  // ── Skeleton loader ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
      {[120, 56, 200, 160].map((h, i) => (
        <div key={i} style={{ height:`${h}px`, borderRadius:"12px",
          background:"rgba(255,255,255,0.03)", animation:"pulse 1.8s ease infinite",
          animationDelay:`${i*0.1}s` }} />
      ))}
    </div>
  );

  if (!stats) return null;

  const goal      = GOAL_CONFIG[stats.goalType] || GOAL_CONFIG.maintain;
  const weightPct = stats.currentWeight && stats.targetWeight
    ? Math.min(100, Math.max(0,
        stats.goalType === "lose"
          ? Math.max(0, 100 - ((stats.currentWeight - stats.targetWeight) / stats.currentWeight * 100))
          : stats.goalType === "gain"
          ? (stats.currentWeight / stats.targetWeight) * 100
          : 100))
    : 0;

  const streakColor = stats.streak >= 14 ? "#f59e0b" : stats.streak >= 7 ? "#10b981" : "#0070f3";
  const firstName   = stats.name?.split(" ")[0] || "there";
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>

      {/* ── Profile incomplete nudge ── */}
      {!stats.profileComplete && (
        <div style={{ display:"flex", alignItems:"center", gap:"12px",
          padding:"12px 16px", borderRadius:"10px",
          background:"rgba(0,112,243,0.06)", border:"1px solid rgba(0,112,243,0.15)" }}>
          <div style={{ width:"6px", height:"6px", borderRadius:"50%",
            background:"var(--accent)", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <span style={{ fontWeight:600, fontSize:"13px", color:"var(--text)" }}>
              Complete your profile
            </span>
            <span style={{ fontSize:"12px", color:"var(--text3)", marginLeft:"8px" }}>
              Add your age, height and weight to unlock personalised insights
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate?.("profile")}>
            Set up
          </button>
        </div>
      )}

      {/* ── Hero banner ── */}
      <div style={{
        borderRadius:"14px", padding:"24px 28px",
        background:"linear-gradient(135deg, rgba(0,112,243,0.10) 0%, rgba(16,185,129,0.06) 100%)",
        border:"1px solid rgba(255,255,255,0.07)",
        position:"relative", overflow:"hidden",
      }}>
        {/* Subtle grid texture */}
        <div style={{ position:"absolute", inset:0, opacity:0.03,
          backgroundImage:"linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
          backgroundSize:"32px 32px", pointerEvents:"none" }} />

        <div style={{ display:"flex", alignItems:"center", gap:"24px",
          flexWrap:"wrap", position:"relative" }}>

          {/* Streak arc */}
          <Arc pct={Math.min(100, stats.streak * 3.33)} size={80} stroke={5} color={streakColor}>
            <div style={{ fontWeight:800, fontSize:"22px", color:streakColor, lineHeight:1 }}>
              {stats.streak}
            </div>
            <div style={{ fontSize:"9px", color:"var(--text3)", textTransform:"uppercase",
              letterSpacing:"0.8px", marginTop:"2px" }}>
              day streak
            </div>
          </Arc>

          {/* Greeting */}
          <div style={{ flex:1, minWidth:"180px" }}>
            <div style={{ fontSize:"12px", color:"var(--text3)", fontWeight:500,
              letterSpacing:"0.3px", marginBottom:"4px" }}>
              {greeting}, {firstName}
            </div>
            <div style={{ fontWeight:700, fontSize:"20px", color:"var(--text)",
              lineHeight:1.2, marginBottom:"10px" }}>
              {stats.loggedToday
                ? "Workout logged. Well done."
                : "No workout logged yet today."}
            </div>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              <StatPill label="workouts" value={stats.totalLogs}       color="var(--accent)"  />
              <StatPill label="programs" value={stats.activePrograms}  color="var(--green)"   />
              <StatPill label="pts"      value={stats.flexPoints}      color="var(--gold)"    />
            </div>
          </div>

          {/* Weight ring */}
          {stats.currentWeight > 0 && (
            <Arc pct={weightPct} size={72} stroke={5} color={goal.color}>
              <div style={{ fontWeight:700, fontSize:"14px", color:"var(--text)", lineHeight:1 }}>
                {stats.currentWeight}
              </div>
              <div style={{ fontSize:"8px", color:"var(--text3)", textTransform:"uppercase",
                letterSpacing:"0.6px", marginTop:"2px" }}>
                kg
              </div>
            </Arc>
          )}
          {stats.targetWeight > 0 && (
            <div style={{ textAlign:"center", marginLeft:"-8px" }}>
              <div style={{ fontSize:"10px", color:"var(--text3)" }}>
                Target {stats.targetWeight}kg
              </div>
              <div style={{ display:"inline-block", marginTop:"4px",
                padding:"2px 8px", borderRadius:"4px", fontSize:"10px",
                fontWeight:700, background:goal.bg, color:goal.color }}>
                {goal.label}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <SectionHead title="Quick Actions" />
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          <Action icon="🏋️" label="Log Workout"  sub="Track today's session"  color="#0070f3" onClick={() => onNavigate?.("workouts")}   />
          <Action icon="📋" label="My Programs"  sub={`${stats.activePrograms} active`}       color="#10b981" onClick={() => onNavigate?.("myprograms")} />
          <Action icon="🥗" label="Diet Plan"    sub="View today's meals"      color="#f59e0b" onClick={() => onNavigate?.("dietplan")}   />
          <Action icon="📸" label="Upload Proof" sub="Send to trainer"         color="#8b5cf6" onClick={() => onNavigate?.("proof")}      />
          <Action icon="⚡" label="My Rewards"   sub={`${stats.flexPoints} pts`}              color="#ef4444" onClick={() => onNavigate?.("rewards")}   />
          <Action icon="📈" label="Progress"     sub="Charts & history"        color="#06b6d4" onClick={() => onNavigate?.("progress")}   />
        </div>
      </div>

      {/* ── Middle row: Diet + Programs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>

        {/* Today's Meals */}
        <div style={{ background:"var(--bg2)", border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:"12px", padding:"18px" }}>
          <SectionHead title="Today's Meals"
            action="Full plan →" onAction={() => onNavigate?.("dietplan")} />
          {stats.todayDiet ? (
            <>
              <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
                {[
                  { v:stats.todayDiet.totalCalories,          u:"kcal",    c:"var(--gold)"    },
                  { v:`${stats.todayDiet.totalProtein}g`,     u:"protein", c:"var(--accent2)" },
                  { v:stats.dietPlan?.dailyCalorieTarget||0,  u:"target",  c:"var(--text3)"   },
                ].map((m, i) => (
                  <div key={i} style={{ flex:1, textAlign:"center", padding:"8px 4px",
                    background:"rgba(255,255,255,0.03)", borderRadius:"8px",
                    border:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontWeight:700, fontSize:"15px", color:m.c }}>{m.v}</div>
                    <div style={{ fontSize:"9px", color:"var(--text3)",
                      textTransform:"uppercase", letterSpacing:"0.5px", marginTop:"2px" }}>{m.u}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                {["breakfast","lunch","dinner"].map(slot => {
                  const items = stats.todayDiet[slot] || [];
                  if (!items.length) return null;
                  const labels = { breakfast:"Breakfast", lunch:"Lunch", dinner:"Dinner" };
                  return (
                    <div key={slot} style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"center", fontSize:"12px", padding:"7px 10px",
                      background:"rgba(255,255,255,0.02)", borderRadius:"7px",
                      border:"1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <span style={{ fontSize:"10px", color:"var(--text3)",
                          textTransform:"uppercase", letterSpacing:"0.5px",
                          marginRight:"6px" }}>{labels[slot]}</span>
                        <span style={{ color:"var(--text2)" }}>
                          {items.map(i=>i.name).join(", ").slice(0,28)}
                          {items.map(i=>i.name).join(", ").length > 28 ? "…" : ""}
                        </span>
                      </div>
                      <span style={{ color:"var(--gold)", fontWeight:600,
                        fontSize:"11px", flexShrink:0, marginLeft:"8px" }}>
                        {items.reduce((s,i)=>s+(i.calories||0),0)} kcal
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:"6px", minHeight:"120px",
              color:"var(--text3)", fontSize:"12px", textAlign:"center" }}>
              <div style={{ fontSize:"24px", opacity:0.4 }}>🥗</div>
              <div style={{ fontWeight:600, color:"var(--text2)" }}>No diet plan assigned</div>
              <div>Your trainer will set up your meal plan</div>
            </div>
          )}
        </div>

        {/* Active Programs */}
        <div style={{ background:"var(--bg2)", border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:"12px", padding:"18px" }}>
          <SectionHead title="Active Programs"
            action="View all →" onAction={() => onNavigate?.("myprograms")} />
          {stats.enrollments.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:"8px", minHeight:"120px",
              color:"var(--text3)", fontSize:"12px", textAlign:"center" }}>
              <div style={{ fontSize:"24px", opacity:0.4 }}>📋</div>
              <div style={{ fontWeight:600, color:"var(--text2)" }}>No active programs</div>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate?.("marketplace")}>
                Browse Programs
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {stats.enrollments.slice(0,3).map((e, i) => (
                <div key={e._id}>
                  {i > 0 && <Div />}
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"10px 0" }}>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:"13px", color:"var(--text)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {e.program?.title}
                      </div>
                      <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
                        {e.program?.durationWeeks}w · {e.program?.trainer?.user?.name || "Trainer"}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0, marginLeft:"10px" }}>
                      <div style={{ width:"6px", height:"6px", borderRadius:"50%",
                        background:"var(--green)" }} />
                      <span style={{ fontSize:"10px", color:"var(--green)",
                        fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      {stats.recentLogs.length > 0 && (
        <div style={{ background:"var(--bg2)", border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:"12px", padding:"18px" }}>
          <SectionHead title="Recent Activity"
            action="Full history →" onAction={() => onNavigate?.("progress")} />
          <div style={{ display:"flex", flexDirection:"column" }}>
            {stats.recentLogs.map((log, i) => (
              <div key={i}>
                {i > 0 && <Div />}
                <div style={{ display:"flex", alignItems:"center", gap:"14px", padding:"10px 0" }}>
                  <div style={{ width:"32px", height:"32px", borderRadius:"8px", flexShrink:0,
                    background:"rgba(0,112,243,0.08)", border:"1px solid rgba(0,112,243,0.15)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"14px" }}>
                    🏋️
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"13px", fontWeight:600, color:"var(--text)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {log.completedExercises?.length > 0
                        ? log.completedExercises.slice(0,3).map(ex => ex.name).join(" · ")
                        : "Workout logged"}
                    </div>
                    <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
                      {new Date(log.date||log.createdAt).toLocaleDateString("en-IN",
                        { weekday:"short", month:"short", day:"numeric" })}
                    </div>
                  </div>
                  {log.weight > 0 && (
                    <div style={{ fontSize:"13px", fontWeight:600,
                      color:"var(--text3)", flexShrink:0 }}>
                      {log.weight} kg
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FlexPoints ── */}
      <div style={{
        borderRadius:"12px", padding:"18px 22px",
        background:"linear-gradient(135deg, rgba(245,158,11,0.08), rgba(0,112,243,0.05))",
        border:"1px solid rgba(245,158,11,0.15)",
        display:"flex", alignItems:"center", gap:"20px",
      }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"10px", fontWeight:700, color:"var(--text3)",
            textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:"4px" }}>
            FlexPoints Balance
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:"8px" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"36px",
              color:"var(--gold)", lineHeight:1 }}>
              {stats.flexPoints.toLocaleString()}
            </div>
            <div style={{ fontSize:"12px", color:"var(--text3)" }}>
              / {stats.lifetimePoints.toLocaleString()} lifetime
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"8px", flexShrink:0 }}>
          <button onClick={() => onNavigate?.("rewards")} style={{
            padding:"8px 16px", borderRadius:"7px", fontSize:"12px",
            fontWeight:700, cursor:"pointer", border:"1px solid rgba(245,158,11,0.35)",
            background:"rgba(245,158,11,0.12)", color:"var(--gold)",
          }}>
            Redeem
          </button>
          <button onClick={() => onNavigate?.("leaderboard")} style={{
            padding:"8px 16px", borderRadius:"7px", fontSize:"12px",
            fontWeight:600, cursor:"pointer",
            border:"1px solid rgba(255,255,255,0.08)",
            background:"rgba(255,255,255,0.03)", color:"var(--text2)",
          }}>
            Leaderboard
          </button>
        </div>
      </div>

    </div>
  );
}