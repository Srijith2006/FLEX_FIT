import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const MEAL_SLOTS = [
  { key:"breakfast",    label:"🌅 Breakfast",       time:"7:00 – 8:00 AM"  },
  { key:"midMorning",   label:"🍎 Mid-Morning",     time:"10:00 – 10:30 AM"},
  { key:"lunch",        label:"☀️ Lunch",            time:"1:00 – 2:00 PM"  },
  { key:"eveningSnack", label:"🍌 Evening Snack",   time:"5:00 – 5:30 PM"  },
  { key:"dinner",       label:"🌙 Dinner",           time:"8:00 – 9:00 PM"  },
  { key:"postWorkout",  label:"💪 Post-Workout",    time:"After workout"   },
];

const GOAL_CONFIG = {
  weight_loss:  { color:"#ef4444", icon:"🔥", label:"Weight Loss"  },
  muscle_gain:  { color:"#10b981", icon:"💪", label:"Muscle Gain"  },
  maintenance:  { color:"#0070f3", icon:"🎯", label:"Maintenance"  },
  endurance:    { color:"#f59e0b", icon:"🏃", label:"Endurance"    },
};

const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// ── Macro pill ─────────────────────────────────────────────────────────────────
function MacroPill({ label, value, unit, color }) {
  return (
    <div style={{ textAlign:"center", padding:"8px 12px", borderRadius:"10px",
      background:`${color}15`, border:`1px solid ${color}30`, minWidth:"64px" }}>
      <div style={{ fontSize:"15px", fontWeight:800, color }}>{value}{unit}</div>
      <div style={{ fontSize:"10px", color:"var(--text3)", marginTop:"2px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
    </div>
  );
}

// ── Calorie ring ───────────────────────────────────────────────────────────────
function CalorieRing({ consumed, target }) {
  const pct   = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const r     = 44;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  const color = pct > 110 ? "#ef4444" : pct >= 90 ? "#10b981" : "#0070f3";

  return (
    <div style={{ position:"relative", width:"110px", height:"110px", flexShrink:0 }}>
      <svg width="110" height="110" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontWeight:800, fontSize:"18px", color, lineHeight:1 }}>{pct}%</div>
        <div style={{ fontSize:"9px", color:"var(--text3)", marginTop:"2px" }}>of goal</div>
      </div>
    </div>
  );
}

// ── Single meal slot ───────────────────────────────────────────────────────────
function MealSlot({ slot, items }) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;

  const slotCals = items.reduce((s, i) => s + (Number(i.calories) || 0), 0);
  const slotProt = items.reduce((s, i) => s + (Number(i.protein)  || 0), 0);

  return (
    <div style={{ borderRadius:"10px", border:"1px solid var(--border)", overflow:"hidden", marginBottom:"8px" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 16px", background:"var(--bg3)", border:"none", cursor:"pointer",
          textAlign:"left" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"16px" }}>{slot.label.split(" ")[0]}</span>
          <div>
            <div style={{ fontWeight:700, fontSize:"13px", color:"var(--text)" }}>
              {slot.label.replace(/^[^ ]+ /,"")}
            </div>
            <div style={{ fontSize:"11px", color:"var(--text3)" }}>{slot.time}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"13px", fontWeight:700, color:"var(--gold)" }}>{slotCals} kcal</div>
            <div style={{ fontSize:"11px", color:"var(--text3)" }}>{slotProt}g protein</div>
          </div>
          <span style={{ color:"var(--text3)", fontSize:"12px", transition:"transform 0.2s",
            transform: open ? "rotate(180deg)" : "none" }}>▼</span>
        </div>
      </button>

      {open && (
        <div style={{ padding:"12px 16px", background:"var(--bg2)", display:"flex", flexDirection:"column", gap:"10px" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
              gap:"12px", paddingBottom: i < items.length-1 ? "10px" : 0,
              borderBottom: i < items.length-1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:"13px" }}>{item.name}</div>
                {item.quantity && (
                  <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>
                    📏 {item.quantity}
                  </div>
                )}
                {item.description && (
                  <div style={{ fontSize:"11px", color:"var(--text2)", marginTop:"3px" }}>{item.description}</div>
                )}
                {item.notes && (
                  <div style={{ fontSize:"11px", color:"var(--accent2)", marginTop:"3px" }}>💡 {item.notes}</div>
                )}
                {/* Linked vendor product */}
                {item.linkedProduct && (
                  <div style={{ marginTop:"6px", display:"inline-flex", alignItems:"center", gap:"6px",
                    padding:"3px 10px", borderRadius:"20px", fontSize:"11px",
                    background:"rgba(0,112,243,0.1)", border:"1px solid rgba(0,112,243,0.2)", color:"var(--accent2)" }}>
                    🛒 Order: {item.linkedProduct.name} — ₹{item.linkedProduct.price}
                  </div>
                )}
              </div>
              {/* Macros */}
              <div style={{ display:"flex", gap:"6px", flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                {item.calories > 0 && (
                  <span style={{ fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"6px",
                    background:"rgba(245,158,11,0.12)", color:"var(--gold)" }}>{item.calories} kcal</span>
                )}
                {item.protein > 0 && (
                  <span style={{ fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"6px",
                    background:"rgba(0,112,243,0.12)", color:"var(--accent2)" }}>{item.protein}g P</span>
                )}
                {item.carbs > 0 && (
                  <span style={{ fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"6px",
                    background:"rgba(16,185,129,0.12)", color:"var(--green)" }}>{item.carbs}g C</span>
                )}
                {item.fat > 0 && (
                  <span style={{ fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"6px",
                    background:"rgba(239,68,68,0.12)", color:"var(--red)" }}>{item.fat}g F</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single day view ────────────────────────────────────────────────────────────
function DayView({ day, calorieTarget }) {
  const filledSlots = MEAL_SLOTS.filter(s => day[s.key]?.length > 0);

  return (
    <div>
      {/* Day macro summary */}
      <div style={{ display:"flex", gap:"16px", alignItems:"center", marginBottom:"16px",
        padding:"16px", background:"var(--bg3)", borderRadius:"12px", flexWrap:"wrap" }}>
        <CalorieRing consumed={day.totalCalories} target={calorieTarget} />
        <div style={{ flex:1, minWidth:"200px" }}>
          <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"10px" }}>
            {day.dayName} — {day.totalCalories} / {calorieTarget} kcal
          </div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            <MacroPill label="Protein" value={day.totalProtein} unit="g" color="#0070f3" />
            <MacroPill label="Carbs"   value={day.totalCarbs}   unit="g" color="#10b981" />
            <MacroPill label="Fat"     value={day.totalFat}     unit="g" color="#ef4444" />
          </div>
        </div>
      </div>

      {/* Meal slots */}
      {filledSlots.length === 0 ? (
        <div style={{ textAlign:"center", padding:"24px", color:"var(--text3)", fontSize:"13px" }}>
          No meals planned for {day.dayName} yet.
        </div>
      ) : (
        filledSlots.map(slot => (
          <MealSlot key={slot.key} slot={slot} items={day[slot.key]} />
        ))
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ClientDietLog() {
  const { token } = useAuth();
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activePlan, setActivePlan] = useState(0);  // index into plans
  const [activeDay, setActiveDay]   = useState(() => {
    // Default to today's day of week (0=Sun → map to Mon=0 index)
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1; // 0=Mon … 6=Sun
  });

  useEffect(() => {
    api.get("/diet-plans/client-plans", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => setPlans(r.data.plans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="card loading-screen" style={{ minHeight:"160px" }}><div className="spinner" /></div>
  );

  if (plans.length === 0) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">🥗</div>
        <div className="empty-state-text">No diet plan assigned yet.</div>
        <div style={{ fontSize:"13px", color:"var(--text3)", marginTop:"6px" }}>
          Your trainer will assign a personalised diet plan once you enrol in a program.
        </div>
      </div>
    </div>
  );

  const plan = plans[activePlan];
  const goal = GOAL_CONFIG[plan.goal] || GOAL_CONFIG.maintenance;
  const day  = plan.days?.[activeDay];

  // Weekly calorie overview
  const weekCalories = plan.days?.map(d => d.totalCalories) || [];
  const maxCal       = Math.max(...weekCalories, 1);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* Plan selector (if multiple) */}
      {plans.length > 1 && (
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {plans.map((p, i) => (
            <button key={p._id} onClick={() => { setActivePlan(i); setActiveDay(0); }}
              style={{ padding:"8px 16px", borderRadius:"20px", fontSize:"13px", fontWeight:700,
                cursor:"pointer", border:`2px solid ${i === activePlan ? "var(--accent)" : "var(--border)"}`,
                background: i === activePlan ? "rgba(0,112,243,0.1)" : "var(--bg3)",
                color: i === activePlan ? "var(--accent)" : "var(--text2)" }}>
              {p.title}
            </button>
          ))}
        </div>
      )}

      {/* Plan header card */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:"20px", marginBottom:"4px" }}>{plan.title}</div>
            {plan.description && (
              <div style={{ fontSize:"13px", color:"var(--text2)", marginBottom:"8px" }}>{plan.description}</div>
            )}
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              <span style={{ fontSize:"12px", fontWeight:700, padding:"3px 12px", borderRadius:"20px",
                background:`${goal.color}18`, color:goal.color, border:`1px solid ${goal.color}33` }}>
                {goal.icon} {goal.label}
              </span>
              <span style={{ fontSize:"12px", fontWeight:700, padding:"3px 12px", borderRadius:"20px",
                background:"rgba(245,158,11,0.12)", color:"var(--gold)", border:"1px solid rgba(245,158,11,0.2)" }}>
                🎯 {plan.dailyCalorieTarget} kcal / day target
              </span>
              {plan.program && (
                <span style={{ fontSize:"12px", color:"var(--text3)", padding:"3px 10px",
                  background:"var(--bg3)", borderRadius:"20px", border:"1px solid var(--border)" }}>
                  📋 {plan.program.title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Weekly calorie bar chart */}
        <div style={{ marginTop:"20px" }}>
          <div style={{ fontSize:"11px", color:"var(--text3)", fontWeight:700, textTransform:"uppercase",
            letterSpacing:"0.5px", marginBottom:"10px" }}>Weekly Calorie Overview</div>
          <div style={{ display:"flex", gap:"6px", alignItems:"flex-end", height:"60px" }}>
            {DAY_NAMES.map((name, i) => {
              const cal  = weekCalories[i] || 0;
              const h    = maxCal > 0 ? Math.max(4, Math.round((cal / maxCal) * 56)) : 4;
              const isToday = i === activeDay;
              return (
                <button key={name} onClick={() => setActiveDay(i)} title={`${name}: ${cal} kcal`}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                    gap:"4px", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  <div style={{ width:"100%", height:`${h}px`, borderRadius:"4px 4px 2px 2px",
                    background: isToday ? "var(--accent)" : cal > 0 ? "var(--accent2)" : "var(--border)",
                    opacity: isToday ? 1 : 0.7, transition:"all 0.2s",
                    outline: isToday ? "2px solid var(--accent)" : "none", outlineOffset:"2px" }} />
                  <span style={{ fontSize:"9px", color: isToday ? "var(--accent)" : "var(--text3)",
                    fontWeight: isToday ? 700 : 400, textTransform:"uppercase" }}>
                    {name.slice(0,3)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
        {DAY_NAMES.map((name, i) => {
          const d = new Date().getDay();
          const todayIdx = d === 0 ? 6 : d - 1;
          const isToday  = i === todayIdx;
          return (
            <button key={name} onClick={() => setActiveDay(i)}
              style={{ padding:"7px 14px", borderRadius:"20px", fontSize:"12px", fontWeight:700,
                cursor:"pointer", transition:"all 0.15s",
                border:`2px solid ${i === activeDay ? "var(--accent)" : "var(--border)"}`,
                background: i === activeDay ? "rgba(0,112,243,0.1)" : "var(--bg3)",
                color: i === activeDay ? "var(--accent)" : "var(--text2)",
                position:"relative" }}>
              {name.slice(0,3)}
              {isToday && (
                <span style={{ position:"absolute", top:"-4px", right:"-4px", width:"8px", height:"8px",
                  borderRadius:"50%", background:"var(--green)", border:"2px solid var(--bg2)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      {day ? (
        <div className="card">
          <DayView day={day} calorieTarget={plan.dailyCalorieTarget} />
        </div>
      ) : (
        <div className="card">
          <div style={{ textAlign:"center", padding:"24px", color:"var(--text3)" }}>No data for this day.</div>
        </div>
      )}

      {/* Trainer notes */}
      {plan.notes && (
        <div className="card" style={{ background:"rgba(0,112,243,0.04)", border:"1px solid rgba(0,112,243,0.2)" }}>
          <div style={{ fontWeight:700, fontSize:"14px", marginBottom:"8px", color:"var(--accent2)" }}>
            📝 Trainer Notes
          </div>
          <div style={{ fontSize:"13px", color:"var(--text2)", lineHeight:"1.6" }}>{plan.notes}</div>
        </div>
      )}
    </div>
  );
}