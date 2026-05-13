import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";
import TrainerAnalytics from "./TrainerAnalytics.jsx";

// ── SVG icons ─────────────────────────────────────────────────────────────────
const Icons = {
  programs:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  plus:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  star:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  diet:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  camera:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  video:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  chevron:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  message:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  check:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  trending:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  users:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

// ── Stat row item ─────────────────────────────────────────────────────────────
function StatRow({ label, value, color = "var(--text)", sub }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"11px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize:"13px", color:"var(--text3)" }}>{label}</span>
      <div style={{ textAlign:"right" }}>
        <span style={{ fontWeight:700, fontSize:"15px", color }}>{value}</span>
        {sub && <div style={{ fontSize:"10px", color:"var(--text3)", marginTop:"1px" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:"10px",
        padding:"11px 14px", borderRadius:"9px",
        border:`1px solid ${hov ? color+"44" : "rgba(255,255,255,0.06)"}`,
        background: hov ? `${color}0e` : "rgba(255,255,255,0.02)",
        cursor:"pointer", transition:"all 0.15s", flex:1, minWidth:"130px",
      }}>
      <div style={{ width:"30px", height:"30px", borderRadius:"7px", flexShrink:0,
        background:`${color}15`, border:`1px solid ${color}25`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color: hov ? color : `${color}cc`, transition:"color 0.15s" }}>
        {icon}
      </div>
      <span style={{ fontSize:"12px", fontWeight:600,
        color: hov ? "var(--text)" : "var(--text2)",
        transition:"color 0.15s", whiteSpace:"nowrap" }}>
        {label}
      </span>
    </button>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({ title, action, onAction }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      marginBottom:"14px" }}>
      <div style={{ fontSize:"11px", fontWeight:700, color:"var(--text3)",
        textTransform:"uppercase", letterSpacing:"1.2px" }}>
        {title}
      </div>
      {action && (
        <button onClick={onAction}
          style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px",
            color:"var(--accent)", background:"none", border:"none",
            cursor:"pointer", fontWeight:600 }}>
          {action} {Icons.chevron}
        </button>
      )}
    </div>
  );
}

export default function TrainerOverview({ onNavigate }) {
  const { token, user } = useAuth();
  const [data,    setData]    = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab,  setSubTab]  = useState("overview");

  useEffect(() => {
    (async () => {
      try {
        const [overRes, cliRes] = await Promise.all([
          api.get("/trainers/overview", { headers:{ Authorization:`Bearer ${token}` } }),
          api.get("/trainers/clients",  { headers:{ Authorization:`Bearer ${token}` } }),
        ]);
        setData(overRes.data);
        setClients(cliRes.data.clients || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      {[56, 120, 200].map((h, i) => (
        <div key={i} style={{ height:`${h}px`, borderRadius:"12px",
          background:"rgba(255,255,255,0.03)", animation:"pulse 1.8s ease infinite" }} />
      ))}
    </div>
  );

  const nav       = onNavigate || (() => {});
  const verified  = data?.verificationStatus === "approved";
  const revenue   = data?.totalRevenue || 0;
  const revPct    = Math.min(100, (revenue / 100000) * 100);
  const firstName = user?.name?.split(" ")[0] || "Coach";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* ── Sub-tab nav ── */}
      <div style={{ display:"flex", gap:"2px", padding:"3px",
        background:"rgba(255,255,255,0.03)", borderRadius:"10px",
        border:"1px solid rgba(255,255,255,0.06)", width:"fit-content" }}>
        {[
          { key:"overview",  label:"Overview"     },
          { key:"analytics", label:"Analytics"    },
        ].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            padding:"7px 18px", borderRadius:"8px", fontSize:"12px",
            fontWeight: subTab===t.key ? 700 : 500,
            background: subTab===t.key ? "var(--surface)" : "transparent",
            border: subTab===t.key ? "1px solid rgba(255,255,255,0.09)" : "1px solid transparent",
            color: subTab===t.key ? "var(--accent)" : "var(--text3)",
            cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
            boxShadow: subTab===t.key ? "0 2px 8px rgba(0,0,0,0.25)" : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "analytics" ? (
        <TrainerAnalytics />
      ) : (
        <>
          {/* ── Hero ── */}
          <div style={{
            borderRadius:"14px", padding:"24px 28px",
            background:"linear-gradient(135deg, rgba(124,58,237,0.09), rgba(0,112,243,0.06))",
            border:"1px solid rgba(255,255,255,0.07)",
            display:"flex", justifyContent:"space-between",
            alignItems:"center", gap:"20px", flexWrap:"wrap",
            position:"relative", overflow:"hidden",
          }}>
            {/* Grid texture */}
            <div style={{ position:"absolute", inset:0, opacity:0.025,
              backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
              backgroundSize:"28px 28px", pointerEvents:"none" }} />

            <div style={{ position:"relative" }}>
              <div style={{ fontSize:"11px", color:"var(--text3)", letterSpacing:"0.3px",
                marginBottom:"4px" }}>
                Trainer Dashboard
              </div>
              <div style={{ fontWeight:700, fontSize:"22px", color:"var(--text)",
                marginBottom:"10px" }}>
                {firstName}
              </div>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:"5px",
                  padding:"4px 10px", borderRadius:"6px", fontSize:"11px", fontWeight:600,
                  background: verified ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  color: verified ? "var(--green)" : "var(--gold)",
                  border:`1px solid ${verified ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                  <span style={{ display:"flex" }}>{verified ? Icons.check : null}</span>
                  {verified ? "Verified" : "Pending Verification"}
                </div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:"5px",
                  padding:"4px 10px", borderRadius:"6px", fontSize:"11px", fontWeight:600,
                  background:"rgba(0,112,243,0.08)", color:"var(--accent)",
                  border:"1px solid rgba(0,112,243,0.15)" }}>
                  <span style={{ display:"flex" }}>{Icons.users}</span>
                  {clients.length} client{clients.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div style={{ textAlign:"right", position:"relative" }}>
              <div style={{ fontSize:"10px", fontWeight:700, color:"var(--text3)",
                textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>
                Total Revenue
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"36px",
                color:"var(--green)", lineHeight:1 }}>
                ₹{revenue.toLocaleString("en-IN")}
              </div>
              {/* Mini progress toward goal */}
              <div style={{ marginTop:"8px", width:"160px" }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  fontSize:"10px", color:"var(--text3)", marginBottom:"4px" }}>
                  <span>₹0</span>
                  <span>Goal ₹1L</span>
                </div>
                <div style={{ height:"4px", background:"rgba(255,255,255,0.07)",
                  borderRadius:"2px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${revPct}%`,
                    background:"linear-gradient(90deg,var(--green),var(--accent))",
                    borderRadius:"2px", transition:"width 0.8s ease" }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick actions ── */}
          <div>
            <SectionHead title="Quick Actions" />
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              <ActionBtn icon={Icons.programs} label="Programs"      color="#0070f3" onClick={() => nav("manage")}          />
              <ActionBtn icon={Icons.plus}     label="Create New"    color="#10b981" onClick={() => nav("builder")}         />
              <ActionBtn icon={Icons.star}     label="Recommend"     color="#f59e0b" onClick={() => nav("recommendations")} />
              <ActionBtn icon={Icons.diet}     label="Diet Plans"    color="#8b5cf6" onClick={() => nav("dietplan")}        />
              <ActionBtn icon={Icons.camera}   label="Client Proofs" color="#06b6d4" onClick={() => nav("clientproofs")}    />
              <ActionBtn icon={Icons.video}    label="Sessions"      color="#ef4444" onClick={() => nav("sessions")}        />
            </div>
          </div>

          {/* ── Two-column grid ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>

            {/* Active Clients */}
            <div style={{ background:"var(--bg2)",
              border:"1px solid rgba(255,255,255,0.06)",
              borderRadius:"12px", padding:"18px" }}>
              <SectionHead title="Active Clients"
                action="View all" onAction={() => nav("clients")} />
              {clients.length === 0 ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", gap:"6px", minHeight:"100px",
                  color:"var(--text3)", fontSize:"12px", textAlign:"center" }}>
                  <div style={{ fontSize:"22px", opacity:0.35 }}>👤</div>
                  <div>No clients enrolled yet</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column" }}>
                  {clients.slice(0, 5).map((c, i) => (
                    <div key={c._id}>
                      {i > 0 && <div style={{ height:"1px", background:"rgba(255,255,255,0.04)" }} />}
                      <div style={{ display:"flex", alignItems:"center",
                        gap:"12px", padding:"10px 0" }}>
                        <div style={{ width:"34px", height:"34px", borderRadius:"9px",
                          flexShrink:0, background:"rgba(0,112,243,0.12)",
                          border:"1px solid rgba(0,112,243,0.2)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontWeight:700, fontSize:"13px", color:"var(--accent)" }}>
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:"13px",
                            color:"var(--text)", overflow:"hidden",
                            textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"1px" }}>
                            {c.goalType || "Muscle Gain"}
                            {c.currentWeight ? ` · ${c.currentWeight}kg` : ""}
                          </div>
                        </div>
                        <button onClick={() => nav("messages")}
                          style={{ display:"flex", alignItems:"center", justifyContent:"center",
                            width:"28px", height:"28px", borderRadius:"7px", flexShrink:0,
                            border:"1px solid rgba(255,255,255,0.08)",
                            background:"rgba(255,255,255,0.03)", cursor:"pointer",
                            color:"var(--text3)", transition:"all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background="rgba(0,112,243,0.1)"; e.currentTarget.style.color="var(--accent)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.03)"; e.currentTarget.style.color="var(--text3)"; }}>
                          {Icons.message}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance */}
            <div style={{ background:"var(--bg2)",
              border:"1px solid rgba(255,255,255,0.06)",
              borderRadius:"12px", padding:"18px" }}>
              <SectionHead title="Performance"
                action="Full analytics" onAction={() => setSubTab("analytics")} />
              <div style={{ display:"flex", flexDirection:"column" }}>
                <StatRow
                  label="Total Programs"
                  value={data?.totalPrograms || 0}
                  color="var(--accent)"
                />
                <StatRow
                  label="Monthly Completions"
                  value={data?.monthlyCompletions || 0}
                  color="var(--green)"
                />
                <StatRow
                  label="Average Rating"
                  value={Number(data?.avgRating || 0).toFixed(1)}
                  color="var(--gold)"
                  sub="out of 5.0"
                />
                <StatRow
                  label="Active Clients"
                  value={clients.length}
                  color="var(--accent2)"
                />
              </div>

              {/* Trending indicator */}
              {data?.monthlyCompletions > 0 && (
                <div style={{ marginTop:"14px", display:"flex", alignItems:"center",
                  gap:"8px", padding:"10px 12px", borderRadius:"8px",
                  background:"rgba(16,185,129,0.06)",
                  border:"1px solid rgba(16,185,129,0.12)" }}>
                  <span style={{ color:"var(--green)", display:"flex" }}>{Icons.trending}</span>
                  <span style={{ fontSize:"12px", color:"var(--text2)" }}>
                    <strong style={{ color:"var(--green)" }}>{data.monthlyCompletions}</strong>
                    {" "}session{data.monthlyCompletions !== 1 ? "s" : ""} completed this month
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}