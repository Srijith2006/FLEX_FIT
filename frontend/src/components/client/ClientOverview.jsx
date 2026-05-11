import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const GOAL_CONFIG = {
  lose:        { icon:"🔥", label:"Weight Loss",   color:"#ef4444" },
  gain:        { icon:"💪", label:"Muscle Gain",   color:"#10b981" },
  maintain:    { icon:"🎯", label:"Maintenance",   color:"#0070f3" },
  endurance:   { icon:"🏃", label:"Endurance",     color:"#f59e0b" },
  flexibility: { icon:"🤸", label:"Flexibility",   color:"#8b5cf6" },
};

// ── Mini ring chart ────────────────────────────────────────────────────────────
function Ring({ pct, size = 80, stroke = 8, color = "var(--accent)", label, sublabel }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontWeight:800, fontSize: size > 70 ? "16px" : "13px", color, lineHeight:1 }}>
          {label}
        </div>
        {sublabel && <div style={{ fontSize:"9px", color:"var(--text3)", marginTop:"2px" }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ── Quick action button ────────────────────────────────────────────────────────
function QuickAction({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px",
        padding:"24px 16px", borderRadius:"16px", border:`1px solid ${color}33`,
        background:`${color}0d`, cursor:"pointer", flex:1,
        transition:"all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.background=`${color}1a`; e.currentTarget.style.transform="translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background=`${color}0d`; e.currentTarget.style.transform="none"; }}>
      <span style={{ fontSize:"32px" }}>{icon}</span>
      <span style={{ fontSize:"13px", fontWeight:700, color, textAlign:"center", lineHeight:"1.2" }}>{label}</span>
    </button>
  );
}

export default function ClientOverview({ onNavigate }) {
  const { token } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, logsRes, enrollRes, dietRes, pointsRes] = await Promise.all([
          api.get("/clients/me",              { headers:{ Authorization:`Bearer ${token}` } }),
          api.get("/workouts/logs/mine",       { headers:{ Authorization:`Bearer ${token}` } }),
          api.get("/programs/enrolled",        { headers:{ Authorization:`Bearer ${token}` } }),
          api.get("/diet-plans/client-plans",  { headers:{ Authorization:`Bearer ${token}` } }).catch(() => ({ data:{ plans:[] } })),
          api.get("/rewards/points",           { headers:{ Authorization:`Bearer ${token}` } }).catch(() => ({ data:{ flexPoints:0, lifetimePoints:0 } })),
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

        // Today's workout from diet plan
        const dayIdx  = new Date().getDay();
        const todayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        const dietPlan = dietRes.data.plans?.[0] || null;
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
        });
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height:"100px", borderRadius:"16px",
          background:"var(--bg3)", animation:"pulse 1.5s infinite" }} />
      ))}
    </div>
  );

  if (!stats) return null;

  const goal = GOAL_CONFIG[stats.goalType] || GOAL_CONFIG.maintain;
  const weightPct = stats.currentWeight && stats.targetWeight
    ? Math.min(100, Math.max(0, stats.goalType === "lose"
        ? Math.max(0, 100 - ((stats.currentWeight - stats.targetWeight) / stats.currentWeight * 100))
        : stats.goalType === "gain"
        ? (stats.currentWeight / stats.targetWeight) * 100
        : 100))
    : 0;

  const streakColor = stats.streak >= 14 ? "#f59e0b" : stats.streak >= 7 ? "#10b981" : "#0070f3";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

      {/* ── Profile incomplete nudge ── */}
      {!stats.profileComplete && (
        <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 18px",
          background:"rgba(0,112,243,0.08)", border:"1px solid rgba(0,112,243,0.2)",
          borderRadius:"14px" }}>
          <span style={{ fontSize:"20px" }}>👋</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:"14px" }}>Complete your profile</div>
            <div style={{ fontSize:"12px", color:"var(--text3)" }}>
              Add your age, height and weight to unlock personalised insights
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate?.("profile")}>
            Set Up →
          </button>
        </div>
      )}

      {/* ── Today's status banner ── */}
      <div style={{ background:"linear-gradient(135deg, rgba(0,112,243,0.12), rgba(16,185,129,0.08))",
        border:"1px solid rgba(0,112,243,0.2)", borderRadius:"20px", padding:"24px",
        display:"flex", gap:"24px", alignItems:"center", flexWrap:"wrap" }}>

        {/* Streak ring */}
        <Ring pct={Math.min(100, stats.streak * 3.33)} size={88} stroke={8}
          color={streakColor} label={stats.streak} sublabel="streak" />

        <div style={{ flex:1, minWidth:"180px" }}>
          <div style={{ fontWeight:800, fontSize:"22px", color:"var(--text)", marginBottom:"4px" }}>
            {stats.loggedToday ? "Great work today! 🔥" : "Ready to train today?"}
          </div>
          <div style={{ fontSize:"14px", color:"var(--text2)", marginBottom:"12px" }}>
            {stats.loggedToday
              ? `${stats.streak} day streak — keep it going!`
              : "Log a workout to keep your streak alive"}
          </div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            <div style={{ padding:"5px 14px", borderRadius:"20px", fontSize:"12px", fontWeight:700,
              background:"rgba(0,112,243,0.12)", color:"var(--accent)" }}>
              🏋️ {stats.totalLogs} workouts
            </div>
            <div style={{ padding:"5px 14px", borderRadius:"20px", fontSize:"12px", fontWeight:700,
              background:"rgba(16,185,129,0.12)", color:"var(--green)" }}>
              📚 {stats.activePrograms} programs
            </div>
            <div style={{ padding:"5px 14px", borderRadius:"20px", fontSize:"12px", fontWeight:700,
              background:"rgba(245,158,11,0.12)", color:"var(--gold)" }}>
              ⚡ {stats.flexPoints} pts
            </div>
          </div>
        </div>

        {/* Weight vs target */}
        {stats.currentWeight > 0 && (
          <div style={{ textAlign:"center", minWidth:"120px" }}>
            <Ring pct={weightPct} size={80} stroke={7} color={goal.color}
              label={`${stats.currentWeight}kg`} sublabel="current" />
            {stats.targetWeight > 0 && (
              <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"6px" }}>
                Target: {stats.targetWeight}kg
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <div style={{ fontSize:"11px", fontWeight:800, color:"var(--text3)", textTransform:"uppercase",
          letterSpacing:"1px", marginBottom:"10px" }}>Quick Actions</div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          <QuickAction icon="🏋️" label="Log Workout"   color="#0070f3" onClick={() => onNavigate?.("workouts")} />
          <QuickAction icon="📋" label="My Programs"   color="#10b981" onClick={() => onNavigate?.("myprograms")} />
          <QuickAction icon="🥗" label="Diet Plan"     color="#f59e0b" onClick={() => onNavigate?.("dietplan")} />
          <QuickAction icon="📸" label="Upload Proof"  color="#8b5cf6" onClick={() => onNavigate?.("proof")} />
          <QuickAction icon="⚡" label="My Rewards"    color="#ef4444" onClick={() => onNavigate?.("rewards")} />
          <QuickAction icon="📈" label="Progress"      color="#06b6d4" onClick={() => onNavigate?.("progress")} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>

        {/* ── Today's diet ── */}
        {stats.todayDiet ? (
          <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
            borderRadius:"16px", padding:"18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              marginBottom:"14px" }}>
              <div style={{ fontWeight:700, fontSize:"14px" }}>🥗 Today's Meals</div>
              <button onClick={() => onNavigate?.("dietplan")}
                style={{ fontSize:"11px", color:"var(--accent)", background:"none",
                  border:"none", cursor:"pointer", fontWeight:700 }}>
                Full plan →
              </button>
            </div>
            <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
              {[
                { v:`${stats.todayDiet.totalCalories}`, u:"kcal", c:"var(--gold)"    },
                { v:`${stats.todayDiet.totalProtein}g`, u:"protein", c:"var(--accent2)" },
                { v:`${stats.dietPlan?.dailyCalorieTarget||0}`, u:"target", c:"var(--text3)" },
              ].map((m,i) => (
                <div key={i} style={{ flex:1, textAlign:"center", padding:"8px 4px",
                  background:"var(--bg3)", borderRadius:"10px" }}>
                  <div style={{ fontWeight:800, fontSize:"16px", color:m.c }}>{m.v}</div>
                  <div style={{ fontSize:"9px", color:"var(--text3)", textTransform:"uppercase" }}>{m.u}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {["breakfast","lunch","dinner"].map(slot => {
                const items = stats.todayDiet[slot] || [];
                if (!items.length) return null;
                const icons = { breakfast:"🌅", lunch:"☀️", dinner:"🌙" };
                return (
                  <div key={slot} style={{ display:"flex", justifyContent:"space-between",
                    fontSize:"12px", padding:"6px 10px", background:"var(--bg3)",
                    borderRadius:"8px" }}>
                    <span style={{ color:"var(--text2)" }}>
                      {icons[slot]} {items.map(i=>i.name).join(", ").slice(0,32)}
                      {items.map(i=>i.name).join(", ").length > 32 ? "…" : ""}
                    </span>
                    <span style={{ color:"var(--gold)", fontWeight:700, flexShrink:0, marginLeft:"8px" }}>
                      {items.reduce((s,i)=>s+(i.calories||0),0)} kcal
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ background:"var(--bg2)", border:"1px dashed var(--border)",
            borderRadius:"16px", padding:"18px", display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:"8px", minHeight:"160px" }}>
            <span style={{ fontSize:"32px" }}>🥗</span>
            <div style={{ fontSize:"13px", fontWeight:600 }}>No diet plan yet</div>
            <div style={{ fontSize:"12px", color:"var(--text3)", textAlign:"center" }}>
              Your trainer will assign a personalised meal plan
            </div>
          </div>
        )}

        {/* ── Active programs ── */}
        <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
          borderRadius:"16px", padding:"18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            marginBottom:"14px" }}>
            <div style={{ fontWeight:700, fontSize:"14px" }}>📋 Active Programs</div>
            <button onClick={() => onNavigate?.("myprograms")}
              style={{ fontSize:"11px", color:"var(--accent)", background:"none",
                border:"none", cursor:"pointer", fontWeight:700 }}>
              View all →
            </button>
          </div>
          {stats.enrollments.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:"8px", minHeight:"100px" }}>
              <span style={{ fontSize:"28px" }}>📚</span>
              <div style={{ fontSize:"12px", color:"var(--text3)", textAlign:"center" }}>
                No programs yet
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate?.("marketplace")}>
                Browse Programs
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {stats.enrollments.slice(0,3).map(e => (
                <div key={e._id} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"10px 12px", background:"var(--bg3)",
                  borderRadius:"10px" }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:"13px", overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.program?.title}</div>
                    <div style={{ fontSize:"11px", color:"var(--text3)" }}>
                      {e.program?.durationWeeks}w · {e.program?.trainer?.user?.name || "Trainer"}
                    </div>
                  </div>
                  <div style={{ width:"8px", height:"8px", borderRadius:"50%",
                    background:"var(--green)", flexShrink:0, marginLeft:"10px" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent workouts ── */}
      {stats.recentLogs.length > 0 && (
        <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
          borderRadius:"16px", padding:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            marginBottom:"14px" }}>
            <div style={{ fontWeight:700, fontSize:"15px" }}>🕐 Recent Activity</div>
            <button onClick={() => onNavigate?.("progress")}
              style={{ fontSize:"11px", color:"var(--accent)", background:"none",
                border:"none", cursor:"pointer", fontWeight:700 }}>
              Full history →
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {stats.recentLogs.map((log, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"14px",
                padding:"10px 14px", background:"var(--bg3)", borderRadius:"12px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"10px", flexShrink:0,
                  background:"rgba(0,112,243,0.12)", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:"18px" }}>
                  🏋️
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"12px", fontWeight:600, color:"var(--text)" }}>
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
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px",
                    color:"var(--text3)", flexShrink:0 }}>
                    {log.weight}kg
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FlexPoints mini card ── */}
      <div style={{ background:"linear-gradient(135deg, rgba(245,158,11,0.12), rgba(0,112,243,0.08))",
        border:"1px solid rgba(245,158,11,0.25)", borderRadius:"16px", padding:"18px",
        display:"flex", alignItems:"center", gap:"16px" }}>
        <div style={{ fontSize:"36px" }}>⚡</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"36px",
            color:"var(--gold)", lineHeight:1 }}>
            {stats.flexPoints.toLocaleString()}
          </div>
          <div style={{ fontSize:"12px", color:"var(--text3)" }}>
            FlexPoints · {stats.lifetimePoints.toLocaleString()} lifetime
          </div>
        </div>
        <button className="btn btn-sm" onClick={() => onNavigate?.("rewards")}
          style={{ background:"rgba(245,158,11,0.2)", color:"var(--gold)",
            border:"1px solid rgba(245,158,11,0.3)", fontWeight:700 }}>
          View Rewards →
        </button>
      </div>

    </div>
  );
}