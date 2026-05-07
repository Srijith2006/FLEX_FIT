import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const MEAL_SLOTS = [
  { key:"breakfast",    label:"🌅 Breakfast",       time:"7:00 – 8:00 AM"  },
  { key:"midMorning",   label:"🍎 Mid-Morning Snack", time:"10:00 – 10:30 AM"},
  { key:"lunch",        label:"🍱 Lunch",             time:"1:00 – 2:00 PM"  },
  { key:"eveningSnack", label:"🥜 Evening Snack",     time:"5:00 – 5:30 PM"  },
  { key:"dinner",       label:"🌙 Dinner",            time:"7:30 – 8:30 PM"  },
  { key:"postWorkout",  label:"💪 Post-Workout",      time:"After workout"   },
];

const GOAL_OPTIONS = [
  { value:"weight_loss",  label:"Weight Loss 🔥",   cal:1500 },
  { value:"muscle_gain",  label:"Muscle Gain 💪",   cal:2800 },
  { value:"maintenance",  label:"Maintenance 🎯",   cal:2000 },
  { value:"endurance",    label:"Endurance 🏃",     cal:2400 },
];

const COMMON_FOODS = {
  breakfast:    ["Oats + Milk", "Boiled Eggs", "Whole Wheat Toast", "Banana", "Greek Yogurt", "Protein Shake", "Poha", "Idli + Sambar"],
  midMorning:   ["Apple", "Mixed Nuts (30g)", "Protein Bar", "Buttermilk", "Sprouts"],
  lunch:        ["Brown Rice", "Grilled Chicken (150g)", "Dal + Roti", "Paneer Sabzi", "Salad", "Rajma Rice", "Curd Rice"],
  eveningSnack: ["Peanut Butter + Toast", "Makhana", "Protein Shake", "Fruit Bowl", "Roasted Chana"],
  dinner:       ["Grilled Fish", "Chicken Curry + Roti", "Vegetable Stir Fry", "Egg Bhurji", "Dalia", "Soup + Salad"],
  postWorkout:  ["Whey Protein Shake", "Banana + Milk", "Chicken Breast", "Egg Whites", "BCAA Drink"],
};

const emptyMeal = () => ({ name:"", quantity:"", calories:0, protein:0, carbs:0, fat:0, notes:"" });

function MealItemRow({ item, onChange, onRemove, slotKey }) {
  const suggestions = COMMON_FOODS[slotKey] || [];
  return (
    <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"12px", marginBottom:"8px" }}>
      <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
        <input className="form-input" list={`food-${slotKey}`} placeholder="Food item name"
          value={item.name} onChange={e => onChange("name", e.target.value)}
          style={{ flex:2 }} />
        <datalist id={`food-${slotKey}`}>
          {suggestions.map(s => <option key={s} value={s} />)}
        </datalist>
        <input className="form-input" placeholder="Qty e.g. 150g / 1 cup"
          value={item.quantity} onChange={e => onChange("quantity", e.target.value)}
          style={{ flex:1 }} />
        <button className="btn btn-danger btn-sm" onClick={onRemove}
          style={{ padding:"0 10px", flexShrink:0 }}>✕</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px", marginBottom:"6px" }}>
        {[["calories","Calories (kcal)","var(--gold)"],["protein","Protein (g)","var(--accent2)"],["carbs","Carbs (g)","var(--green)"],["fat","Fat (g)","var(--text2)"]].map(([f,l,c]) => (
          <div key={f} className="form-group" style={{ gap:"3px" }}>
            <label className="form-label" style={{ fontSize:"9px", color:c }}>{l}</label>
            <input className="form-input" type="number" min="0" step="0.1"
              value={item[f]} onChange={e => onChange(f, e.target.value)} />
          </div>
        ))}
      </div>
      <input className="form-input" placeholder="Note to client (optional, e.g. 'Avoid sugar')"
        value={item.notes} onChange={e => onChange("notes", e.target.value)}
        style={{ fontSize:"12px" }} />
    </div>
  );
}

function DayEditor({ day, dayIndex, onChange }) {
  const [openSlot, setOpenSlot] = useState(null);

  const addItem = (slot) => {
    const updated = { ...day, [slot]: [...(day[slot]||[]), emptyMeal()] };
    onChange(updated);
  };

  const updateItem = (slot, idx, field, val) => {
    const updated = {
      ...day,
      [slot]: day[slot].map((item, i) => i === idx ? { ...item, [field]: val } : item),
    };
    onChange(updated);
  };

  const removeItem = (slot, idx) => {
    const updated = { ...day, [slot]: day[slot].filter((_, i) => i !== idx) };
    onChange(updated);
  };

  // Calculate day totals
  const totals = MEAL_SLOTS.reduce((acc, { key }) => {
    (day[key]||[]).forEach(item => {
      acc.cal += Number(item.calories)||0;
      acc.pro += Number(item.protein)||0;
      acc.car += Number(item.carbs)||0;
      acc.fat += Number(item.fat)||0;
    });
    return acc;
  }, { cal:0, pro:0, car:0, fat:0 });

  return (
    <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
      {/* Day header with totals */}
      <div style={{ padding:"14px 16px", background:"var(--surface2)", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", letterSpacing:"1px", color:"var(--accent)" }}>
          {day.dayName}
        </div>
        <div style={{ display:"flex", gap:"12px", fontSize:"11px" }}>
          {totals.cal > 0 && (
            <>
              <span style={{ color:"var(--gold)", fontWeight:700 }}>{Math.round(totals.cal)} kcal</span>
              <span style={{ color:"var(--accent2)" }}>{Math.round(totals.pro)}g protein</span>
              <span style={{ color:"var(--green)" }}>{Math.round(totals.car)}g carbs</span>
              <span style={{ color:"var(--text2)" }}>{Math.round(totals.fat)}g fat</span>
            </>
          )}
        </div>
      </div>

      <div style={{ padding:"14px 16px" }}>
        {MEAL_SLOTS.map(({ key, label, time }) => {
          const items = day[key] || [];
          const isOpen = openSlot === key;
          const slotCal = items.reduce((s,i) => s + (Number(i.calories)||0), 0);

          return (
            <div key={key} style={{ marginBottom:"8px" }}>
              <div
                onClick={() => setOpenSlot(isOpen ? null : key)}
                style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"10px 12px", background:isOpen?"var(--bg2)":"var(--bg)",
                  border:`1px solid ${isOpen?"var(--border2)":"var(--border)"}`,
                  borderRadius:"var(--radius)", cursor:"pointer", transition:"all 0.15s",
                }}
              >
                <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                  <span style={{ fontSize:"14px" }}>{label}</span>
                  <span style={{ fontSize:"11px", color:"var(--text3)" }}>{time}</span>
                </div>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  {items.length > 0 && (
                    <span style={{ fontSize:"11px", color:"var(--text3)" }}>
                      {items.length} item{items.length > 1 ? "s" : ""}
                      {slotCal > 0 && ` · ${Math.round(slotCal)} kcal`}
                    </span>
                  )}
                  <span style={{ color:"var(--text3)", fontSize:"12px" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding:"12px", background:"var(--bg2)", border:"1px solid var(--border2)", borderTop:"none", borderRadius:"0 0 var(--radius) var(--radius)" }}>
                  {items.map((item, i) => (
                    <MealItemRow
                      key={i}
                      item={item}
                      slotKey={key}
                      onChange={(field, val) => updateItem(key, i, field, val)}
                      onRemove={() => removeItem(key, i)}
                    />
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={() => addItem(key)} style={{ marginTop:"4px" }}>
                    + Add {label.split(" ").slice(1).join(" ")} Item
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrainerDietPlanBuilder() {
  const { token } = useAuth();
  const [plans, setPlans]       = useState([]);
  const [programs, setPrograms] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editPlan, setEditPlan] = useState(null);   // plan being edited
  const [activeDay, setActiveDay] = useState(0);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ type:"", text:"" });
  const [loading, setLoading]   = useState(true);

  const [form, setForm] = useState({
    title:"", description:"", goal:"maintenance",
    dailyCalorieTarget:2000, programId:"", notes:"",
  });

  const load = async () => {
    try {
      const [pRes, progRes] = await Promise.all([
        api.get("/diet-plans/mine",  { headers:{ Authorization:`Bearer ${token}` } }),
        api.get("/programs/mine",    { headers:{ Authorization:`Bearer ${token}` } }),
      ]);
      setPlans(pRes.data.plans || []);
      setPrograms(progRes.data.programs || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const createPlan = async () => {
    if (!form.title.trim()) { setMsg({ type:"error", text:"Plan title is required." }); return; }
    setSaving(true); setMsg({ type:"", text:"" });
    try {
      const res = await api.post("/diet-plans", {
        ...form,
        dailyCalorieTarget: Number(form.dailyCalorieTarget),
      }, { headers:{ Authorization:`Bearer ${token}` } });
      setMsg({ type:"success", text:"Diet plan created! Now add meals for each day." });
      setCreating(false);
      setEditPlan(res.data.plan);
      setActiveDay(0);
      load();
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Failed to create plan." });
    } finally { setSaving(false); }
  };

  const saveDay = async (planId, dayIndex, dayData) => {
    try {
      await api.put(`/diet-plans/${planId}/day/${dayIndex}`, {
        breakfast:    dayData.breakfast,
        midMorning:   dayData.midMorning,
        lunch:        dayData.lunch,
        eveningSnack: dayData.eveningSnack,
        dinner:       dayData.dinner,
        postWorkout:  dayData.postWorkout,
      }, { headers:{ Authorization:`Bearer ${token}` } });
      setMsg({ type:"success", text:`${DAY_NAMES[dayIndex]} saved!` });
      // Update local state
      setEditPlan(prev => ({
        ...prev,
        days: prev.days.map((d, i) => i === dayIndex ? dayData : d),
      }));
    } catch (e) {
      setMsg({ type:"error", text: e?.response?.data?.message || "Failed to save day." });
    }
  };

  const deletePlan = async (planId) => {
    if (!confirm("Delete this diet plan?")) return;
    try {
      await api.delete(`/diet-plans/${planId}`, { headers:{ Authorization:`Bearer ${token}` } });
      if (editPlan?._id === planId) setEditPlan(null);
      load();
    } catch {}
  };

  const handleGoalChange = (goal) => {
    const preset = GOAL_OPTIONS.find(g => g.value === goal);
    setForm(f => ({ ...f, goal, dailyCalorieTarget: preset?.cal || 2000 }));
  };

  if (loading) return <div className="card loading-screen" style={{minHeight:"200px"}}><div className="spinner"></div></div>;

  // ── EDITING A PLAN ────────────────────────────────────────────────────────
  if (editPlan) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      {/* Header */}
      <div className="card" style={{ padding:"16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px" }}>
          <div>
            <h3 className="font-heading" style={{ fontSize:"22px", marginBottom:"4px" }}>{editPlan.title}</h3>
            <div style={{ fontSize:"13px", color:"var(--text2)" }}>
              {GOAL_OPTIONS.find(g => g.value === editPlan.goal)?.label} ·
              Target: <strong style={{color:"var(--gold)"}}>{editPlan.dailyCalorieTarget} kcal/day</strong>
              {editPlan.program?.title && ` · For: ${editPlan.program.title}`}
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => { setEditPlan(null); setMsg({type:"",text:""}); }}>
            ← Back to Plans
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type==="error"?"error":"success"}`}>
          {msg.text}
          <button onClick={()=>setMsg({type:"",text:""})} style={{background:"none",border:"none",marginLeft:"auto",cursor:"pointer",color:"inherit"}}>✕</button>
        </div>
      )}

      {/* Day tabs */}
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
        {DAY_NAMES.map((name, i) => {
          const day = editPlan.days?.[i];
          const hasItems = day && MEAL_SLOTS.some(s => (day[s.key]||[]).length > 0);
          return (
            <button key={i}
              className={`btn btn-sm ${activeDay === i ? "btn-primary" : "btn-outline"}`}
              onClick={() => setActiveDay(i)}
              style={{ position:"relative" }}
            >
              {name.slice(0,3)}
              {hasItems && <span style={{ position:"absolute", top:"-4px", right:"-4px", width:"8px", height:"8px", background:"var(--green)", borderRadius:"50%" }}/>}
            </button>
          );
        })}
      </div>

      {/* Day editor */}
      {editPlan.days?.[activeDay] && (
        <div>
          <DayEditor
            day={editPlan.days[activeDay]}
            dayIndex={activeDay}
            onChange={(updatedDay) => {
              setEditPlan(prev => ({
                ...prev,
                days: prev.days.map((d, i) => i === activeDay ? updatedDay : d),
              }));
            }}
          />
          <button
            className="btn btn-accent btn-full"
            style={{ marginTop:"12px" }}
            onClick={() => saveDay(editPlan._id, activeDay, editPlan.days[activeDay])}
          >
            💾 Save {DAY_NAMES[activeDay]}'s Meals
          </button>
        </div>
      )}
    </div>
  );

  // ── PLAN LIST + CREATE ────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      <div className="card">
        <div className="flex-between mb-4">
          <h3 className="font-heading" style={{ fontSize:"22px" }}>Diet Plans</h3>
          <button className="btn btn-accent btn-sm" onClick={() => setCreating(c => !c)}>
            {creating ? "✕ Cancel" : "+ Create Plan"}
          </button>
        </div>

        {msg.text && (
          <div className={`alert alert-${msg.type==="error"?"error":"success"} mb-4`}>{msg.text}</div>
        )}

        {/* Create form */}
        {creating && (
          <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"16px", marginBottom:"16px" }}>
            <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"14px" }}>New Diet Plan</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Plan Title *</label>
                  <input className="form-input" placeholder="e.g. 4-Week Weight Loss Plan"
                    value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign to Program (optional)</label>
                  <select className="form-select" value={form.programId}
                    onChange={e => setForm(f=>({...f,programId:e.target.value}))}>
                    <option value="">No program — standalone plan</option>
                    {programs.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows="2"
                  placeholder="Briefly describe what this diet plan aims to achieve…"
                  value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
              </div>

              {/* Goal selector */}
              <div className="form-group">
                <label className="form-label">Goal</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px" }}>
                  {GOAL_OPTIONS.map(g => (
                    <div key={g.value} onClick={() => handleGoalChange(g.value)} style={{
                      border:`1px solid ${form.goal===g.value?"var(--accent2)":"var(--border)"}`,
                      borderRadius:"var(--radius)", padding:"10px 8px", cursor:"pointer",
                      background:form.goal===g.value?"rgba(0,112,243,0.1)":"var(--bg)",
                      textAlign:"center", transition:"all 0.15s",
                    }}>
                      <div style={{ fontSize:"13px", fontWeight:700, color:form.goal===g.value?"var(--accent2)":"var(--text)" }}>{g.label}</div>
                      <div style={{ fontSize:"10px", color:"var(--text3)", marginTop:"2px" }}>~{g.cal} kcal</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Daily Calorie Target (kcal)</label>
                <input className="form-input" type="number" min="800" max="6000"
                  value={form.dailyCalorieTarget}
                  onChange={e => setForm(f=>({...f,dailyCalorieTarget:e.target.value}))} />
                <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"4px" }}>
                  Typical ranges: Weight loss 1200–1600 · Maintenance 1800–2200 · Muscle gain 2500–3500
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">General Notes for Client</label>
                <textarea className="form-textarea" rows="2"
                  placeholder="e.g. Drink 3L water daily. Avoid processed foods. Meal timings are important…"
                  value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
              </div>

              <button className="btn btn-accent" onClick={createPlan} disabled={saving}>
                {saving ? "Creating…" : "Create Plan & Add Meals →"}
              </button>
            </div>
          </div>
        )}

        {/* Plan list */}
        {plans.length === 0 && !creating ? (
          <div className="empty-state">
            <div className="empty-state-icon">🥗</div>
            <div className="empty-state-text">No diet plans yet. Create one to assign to your clients or programs.</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {plans.map(plan => {
              const totalMeals = plan.days?.reduce((s, d) =>
                s + MEAL_SLOTS.reduce((ss, { key }) => ss + (d[key]?.length||0), 0), 0) || 0;

              return (
                <div key={plan._id} style={{
                  padding:"14px 16px", background:"var(--bg3)",
                  border:"1px solid var(--border)", borderRadius:"var(--radius)",
                  display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px"
                }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"4px" }}>{plan.title}</div>
                    <div style={{ fontSize:"12px", color:"var(--text3)" }}>
                      {GOAL_OPTIONS.find(g=>g.value===plan.goal)?.label} ·
                      {plan.dailyCalorieTarget} kcal/day ·
                      {totalMeals} meals added
                      {plan.program?.title && ` · Program: ${plan.program.title}`}
                    </div>
                    {plan.notes && <div style={{ fontSize:"11px", color:"var(--text2)", marginTop:"4px" }}>{plan.notes}</div>}
                  </div>
                  <div style={{ display:"flex", gap:"8px", flexShrink:0 }}>
                    <button className="btn btn-primary btn-sm"
                      onClick={() => { setEditPlan(plan); setActiveDay(0); setMsg({type:"",text:""}); }}>
                      Edit Meals
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deletePlan(plan._id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}