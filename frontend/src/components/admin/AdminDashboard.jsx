import { useEffect, useState, useCallback } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

/* ─── CSS injected once ─────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  .adm-root { --adm-bg: #080c10; --adm-surface: #0e1318; --adm-card: #121820; --adm-border: rgba(255,255,255,0.07); --adm-border2: rgba(255,255,255,0.12); --adm-text: #e8edf2; --adm-text2: #8d97a3; --adm-text3: #4a5560; --adm-accent: #4f9eff; --adm-green: #34d399; --adm-gold: #fbbf24; --adm-red: #f87171; --adm-purple: #a78bfa; --adm-cyan: #22d3ee; font-family:'DM Sans',sans-serif; background:var(--adm-bg); color:var(--adm-text); min-height:100vh; }

  .adm-layout { display:grid; grid-template-columns:220px 1fr; grid-template-rows:auto 1fr; min-height:100vh; }
  .adm-topbar { grid-column:1/-1; display:flex; align-items:center; justify-content:space-between; padding:0 28px; height:56px; border-bottom:1px solid var(--adm-border); background:var(--adm-surface); position:sticky; top:0; z-index:100; }
  .adm-logo { font-family:'Syne',sans-serif; font-weight:800; font-size:18px; letter-spacing:-0.5px; color:var(--adm-text); display:flex; align-items:center; gap:9px; }
  .adm-logo-dot { width:8px; height:8px; border-radius:50%; background:var(--adm-accent); box-shadow:0 0 12px var(--adm-accent); }
  .adm-topbar-right { display:flex; align-items:center; gap:14px; }
  .adm-admin-pill { display:flex; align-items:center; gap:8px; padding:5px 12px 5px 5px; border-radius:20px; background:rgba(79,158,255,0.08); border:1px solid rgba(79,158,255,0.18); font-size:12px; font-weight:600; color:var(--adm-accent); }
  .adm-admin-avatar { width:26px; height:26px; border-radius:50%; background:var(--adm-accent); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#000; }

  .adm-sidebar { background:var(--adm-surface); border-right:1px solid var(--adm-border); padding:20px 12px; display:flex; flex-direction:column; gap:4px; position:sticky; top:56px; height:calc(100vh - 56px); overflow-y:auto; }
  .adm-nav-section { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; color:var(--adm-text3); text-transform:uppercase; letter-spacing:1.5px; padding:14px 10px 6px; }
  .adm-nav-btn { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:8px; border:1px solid transparent; background:none; cursor:pointer; color:var(--adm-text2); font-size:13px; font-weight:500; font-family:'DM Sans',sans-serif; width:100%; transition:all 0.15s; text-align:left; }
  .adm-nav-btn:hover { background:rgba(255,255,255,0.04); color:var(--adm-text); }
  .adm-nav-btn.active { background:rgba(79,158,255,0.1); border-color:rgba(79,158,255,0.2); color:var(--adm-accent); font-weight:600; }
  .adm-nav-icon { width:28px; height:28px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; background:rgba(255,255,255,0.04); }
  .adm-nav-btn.active .adm-nav-icon { background:rgba(79,158,255,0.12); }
  .adm-badge { margin-left:auto; min-width:18px; padding:1px 6px; border-radius:9px; background:rgba(251,191,36,0.15); color:var(--adm-gold); font-size:10px; font-weight:700; font-family:'DM Mono',monospace; }

  .adm-content { padding:28px; overflow-y:auto; }
  .adm-page-head { margin-bottom:28px; }
  .adm-page-title { font-family:'Syne',sans-serif; font-weight:700; font-size:26px; letter-spacing:-0.5px; color:var(--adm-text); margin-bottom:4px; }
  .adm-page-sub { font-size:13px; color:var(--adm-text2); }

  .adm-card { background:var(--adm-card); border:1px solid var(--adm-border); border-radius:14px; padding:20px; }
  .adm-card-sm { background:var(--adm-card); border:1px solid var(--adm-border); border-radius:12px; padding:16px; }

  .adm-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
  .adm-kpi { background:var(--adm-card); border:1px solid var(--adm-border); border-radius:14px; padding:18px 20px; position:relative; overflow:hidden; transition:border-color 0.2s; }
  .adm-kpi:hover { border-color:var(--adm-border2); }
  .adm-kpi-glow { position:absolute; top:0; right:0; width:80px; height:80px; border-radius:50%; opacity:0.06; transform:translate(30px,-30px); }
  .adm-kpi-label { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; color:var(--adm-text3); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .adm-kpi-value { font-family:'Syne',sans-serif; font-weight:700; font-size:28px; line-height:1; margin-bottom:6px; }
  .adm-kpi-delta { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:2px 7px; border-radius:5px; }

  .adm-table-wrap { overflow-x:auto; }
  .adm-table { width:100%; border-collapse:collapse; font-size:13px; }
  .adm-table th { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; color:var(--adm-text3); text-transform:uppercase; letter-spacing:1px; padding:8px 14px; border-bottom:1px solid var(--adm-border); text-align:left; white-space:nowrap; }
  .adm-table td { padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; color:var(--adm-text2); }
  .adm-table tr:last-child td { border-bottom:none; }
  .adm-table tr:hover td { background:rgba(255,255,255,0.02); }
  .adm-avatar { width:32px; height:32px; border-radius:9px; background:rgba(79,158,255,0.12); border:1px solid rgba(79,158,255,0.18); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; color:var(--adm-accent); flex-shrink:0; }

  .adm-badge-status { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:6px; font-size:11px; font-weight:600; }
  .adm-badge-status.pending { background:rgba(251,191,36,0.1); color:var(--adm-gold); }
  .adm-badge-status.approved { background:rgba(52,211,153,0.1); color:var(--adm-green); }
  .adm-badge-status.rejected { background:rgba(248,113,113,0.1); color:var(--adm-red); }
  .adm-badge-status.active { background:rgba(52,211,153,0.1); color:var(--adm-green); }
  .adm-badge-status.inactive { background:rgba(255,255,255,0.06); color:var(--adm-text3); }

  .adm-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; font-size:12px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s; border:none; }
  .adm-btn-primary { background:var(--adm-accent); color:#000; }
  .adm-btn-primary:hover { opacity:0.85; }
  .adm-btn-success { background:rgba(52,211,153,0.12); color:var(--adm-green); border:1px solid rgba(52,211,153,0.2); }
  .adm-btn-success:hover { background:rgba(52,211,153,0.2); }
  .adm-btn-danger { background:rgba(248,113,113,0.12); color:var(--adm-red); border:1px solid rgba(248,113,113,0.2); }
  .adm-btn-danger:hover { background:rgba(248,113,113,0.2); }
  .adm-btn-ghost { background:rgba(255,255,255,0.04); color:var(--adm-text2); border:1px solid var(--adm-border); }
  .adm-btn-ghost:hover { background:rgba(255,255,255,0.08); color:var(--adm-text); }
  .adm-btn:disabled { opacity:0.45; cursor:not-allowed; }

  .adm-input { background:rgba(255,255,255,0.04); border:1px solid var(--adm-border); border-radius:8px; padding:8px 12px; color:var(--adm-text); font-size:13px; font-family:'DM Sans',sans-serif; outline:none; width:100%; }
  .adm-input:focus { border-color:rgba(79,158,255,0.4); }

  .adm-tabs { display:flex; gap:2px; padding:3px; background:rgba(255,255,255,0.03); border:1px solid var(--adm-border); border-radius:10px; width:fit-content; margin-bottom:18px; }
  .adm-tab { padding:6px 16px; border-radius:7px; font-size:12px; font-weight:500; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s; border:1px solid transparent; color:var(--adm-text3); background:transparent; }
  .adm-tab.active { background:var(--adm-surface); border-color:var(--adm-border2); color:var(--adm-accent); font-weight:700; box-shadow:0 2px 8px rgba(0,0,0,0.3); }

  .adm-search { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.04); border:1px solid var(--adm-border); border-radius:9px; padding:0 12px; flex:1; max-width:280px; }
  .adm-search input { background:none; border:none; outline:none; color:var(--adm-text); font-size:13px; font-family:'DM Sans',sans-serif; padding:8px 0; width:100%; }
  .adm-search input::placeholder { color:var(--adm-text3); }

  .adm-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:48px; color:var(--adm-text3); font-size:13px; text-align:center; }
  .adm-empty-icon { font-size:28px; opacity:0.3; }

  .adm-row-action { display:flex; gap:6px; }
  .adm-inline-reason { display:flex; gap:8px; align-items:center; margin-top:10px; padding:10px 12px; background:rgba(255,255,255,0.02); border:1px solid var(--adm-border); border-radius:9px; }

  .adm-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,0.1); border-top-color:var(--adm-accent); border-radius:50%; animation:adm-spin 0.7s linear infinite; }
  @keyframes adm-spin { to { transform:rotate(360deg); } }
  @keyframes adm-pulse { 0%,100%{opacity:0.4}50%{opacity:0.7} }
  .adm-skel { border-radius:10px; background:rgba(255,255,255,0.04); animation:adm-pulse 1.8s ease infinite; }

  .adm-stat-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .adm-stat-row:last-child { border-bottom:none; }

  .adm-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .adm-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .adm-section-title { font-family:'DM Mono',monospace; font-size:10px; font-weight:500; color:var(--adm-text3); text-transform:uppercase; letter-spacing:1.3px; margin-bottom:14px; }
  .adm-alert { padding:10px 14px; border-radius:8px; font-size:12px; font-weight:600; margin-bottom:14px; }
  .adm-alert.success { background:rgba(52,211,153,0.08); color:var(--adm-green); border:1px solid rgba(52,211,153,0.18); }
  .adm-alert.error { background:rgba(248,113,113,0.08); color:var(--adm-red); border:1px solid rgba(248,113,113,0.18); }

  .adm-mono { font-family:'DM Mono',monospace; }
  .adm-detail-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; margin-top:14px; }
  .adm-detail-item { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:9px; padding:10px 12px; }
  .adm-detail-label { font-size:10px; color:var(--adm-text3); text-transform:uppercase; letter-spacing:0.8px; font-family:'DM Mono',monospace; margin-bottom:4px; }
  .adm-detail-val { font-size:13px; font-weight:600; color:var(--adm-text); }

  .adm-cert-link { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:7px; font-size:11px; font-weight:600; color:var(--adm-accent); background:rgba(79,158,255,0.08); border:1px solid rgba(79,158,255,0.18); text-decoration:none; }
  .adm-no-cert { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:var(--adm-text3); }
`;

function injectStyles() {
  if (document.getElementById("adm-styles")) return;
  const s = document.createElement("style");
  s.id = "adm-styles";
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const fmtINR = n => `₹${(n || 0).toLocaleString("en-IN")}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const initial = name => (name || "?")[0].toUpperCase();

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  return <span className={`adm-badge-status ${s}`}>{status || "—"}</span>;
}

function Spinner() { return <div className="adm-spinner" />; }

function EmptyState({ icon = "📭", text = "Nothing here yet." }) {
  return (
    <div className="adm-empty">
      <div className="adm-empty-icon">{icon}</div>
      <div style={{ color: "var(--adm-text2)", fontWeight: 600 }}>{text}</div>
    </div>
  );
}

function Skel({ h = 40, mb = 0 }) {
  return <div className="adm-skel" style={{ height: h, marginBottom: mb }} />;
}

/* ─── KPI card ──────────────────────────────────────────────────────────────── */
function KPICard({ label, value, color, icon, delta }) {
  return (
    <div className="adm-kpi">
      <div className="adm-kpi-glow" style={{ background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="adm-kpi-label">{label}</div>
          <div className="adm-kpi-value" style={{ color }}>{value}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
      </div>
      {delta != null && (
        <div className="adm-kpi-delta" style={{ background: delta >= 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: delta >= 0 ? "var(--adm-green)" : "var(--adm-red)" }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last month
        </div>
      )}
    </div>
  );
}

/* ─── Search bar ──────────────────────────────────────────────────────────────*/
function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="adm-search">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--adm-text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button onClick={() => onChange("")} style={{ background: "none", border: "none", color: "var(--adm-text3)", cursor: "pointer", fontSize: 14 }}>✕</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   OVERVIEW PAGE
═══════════════════════════════════════════════════════════════════════════════ */
function OverviewPage({ token, pendingTrainers, pendingVendors }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, vRes, cRes] = await Promise.all([
          api.get("/trainers/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { trainers: [] } })),
          api.get("/vendors/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { vendors: [] } })),
          api.get("/clients/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { clients: [] } })),
        ]);
        const trainers = tRes.data.trainers || [];
        const vendors = vRes.data.vendors || [];
        const clients = cRes.data.clients || [];
        // totalRevenue is now computed server-side per trainer (enrolledCount × price)
        const trainerGross = trainers.reduce((s, t) => s + (t.totalRevenue || 0), 0);
        const vendorGross = vendors.reduce((s, v) => s + (v.totalRevenue || 0), 0);
        const grossRevenue = trainerGross + vendorGross;
        const platformRevenue = Math.round(grossRevenue * 0.15);
        const sortByNewest = arr => [...arr].sort((a, b) => new Date(b.createdAt || b.user?.createdAt || 0) - new Date(a.createdAt || a.user?.createdAt || 0));
        setStats({
          totalTrainers: trainers.length,
          approvedTrainers: trainers.filter(t => t.verificationStatus === "approved").length,
          totalVendors: vendors.length,
          approvedVendors: vendors.filter(v => v.verificationStatus === "approved").length,
          totalClients: clients.length,
          trainerGross, vendorGross, grossRevenue, platformRevenue,
          recentTrainers: sortByNewest(trainers).slice(0, 5),
          recentVendors: sortByNewest(vendors).slice(0, 5),
        });
      } catch { }
      finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="adm-kpi-grid">{[1, 2, 3, 4].map(i => <Skel key={i} h={110} />)}</div>
      <Skel h={200} />
    </div>
  );

  return (
    <div>
      <div className="adm-kpi-grid">
        <KPICard label="Total Clients" value={stats?.totalClients ?? 0} color="var(--adm-accent)" icon="👤" />
        <KPICard label="Active Trainers" value={`${stats?.approvedTrainers ?? 0} / ${stats?.totalTrainers ?? 0}`} color="var(--adm-green)" icon="💪" />
        <KPICard label="Active Vendors" value={`${stats?.approvedVendors ?? 0} / ${stats?.totalVendors ?? 0}`} color="var(--adm-purple)" icon="🏪" />
        <KPICard label="Platform Revenue (15%)" value={fmtINR(stats?.platformRevenue)} color="var(--adm-gold)" icon="💰" />
      </div>

      {(pendingTrainers > 0 || pendingVendors > 0) && (
        <div style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {pendingTrainers > 0 && (
            <div style={{ flex: 1, minWidth: 180, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22 }}>⏳</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--adm-gold)" }}>{pendingTrainers} Trainer{pendingTrainers > 1 ? "s" : ""} Awaiting Review</div>
                <div style={{ fontSize: 12, color: "var(--adm-text3)", marginTop: 2 }}>Certificate verification needed</div>
              </div>
            </div>
          )}
          {pendingVendors > 0 && (
            <div style={{ flex: 1, minWidth: 180, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22 }}>🏪</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--adm-purple)" }}>{pendingVendors} Vendor{pendingVendors > 1 ? "s" : ""} Awaiting Review</div>
                <div style={{ fontSize: 12, color: "var(--adm-text3)", marginTop: 2 }}>License / FSSAI review needed</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="adm-grid-2">
        <div className="adm-card">
          <div className="adm-section-title">Recent Trainers</div>
          {(stats?.recentTrainers || []).length === 0 ? <EmptyState icon="💪" text="No trainers yet." /> : (
            <table className="adm-table">
              <thead><tr><th>Name</th><th>Status</th><th>Revenue</th></tr></thead>
              <tbody>
                {(stats.recentTrainers).map(t => (
                  <tr key={t._id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><div className="adm-avatar">{initial(t.user?.name)}</div><div><div style={{ color: "var(--adm-text)", fontWeight: 600, fontSize: 13 }}>{t.user?.name || "—"}</div><div style={{ fontSize: 11, color: "var(--adm-text3)" }}>{t.user?.email}</div></div></div></td>
                    <td><StatusBadge status={t.verificationStatus} /></td>
                    <td><span className="adm-mono" style={{ color: "var(--adm-green)", fontWeight: 600 }}>{fmtINR(t.totalRevenue)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="adm-card">
          <div className="adm-section-title">Recent Vendors</div>
          {(stats?.recentVendors || []).length === 0 ? <EmptyState icon="🏪" text="No vendors yet." /> : (
            <table className="adm-table">
              <thead><tr><th>Business</th><th>Status</th><th>Revenue</th></tr></thead>
              <tbody>
                {(stats.recentVendors).map(v => (
                  <tr key={v._id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><div className="adm-avatar" style={{ background: "rgba(167,139,250,0.12)", color: "var(--adm-purple)" }}>{initial(v.businessName || v.user?.name)}</div><div><div style={{ color: "var(--adm-text)", fontWeight: 600, fontSize: 13 }}>{v.businessName || "—"}</div><div style={{ fontSize: 11, color: "var(--adm-text3)" }}>{v.user?.email}</div></div></div></td>
                    <td><StatusBadge status={v.verificationStatus} /></td>
                    <td><span className="adm-mono" style={{ color: "var(--adm-gold)", fontWeight: 600 }}>{fmtINR(v.totalRevenue)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CLIENTS PAGE
═══════════════════════════════════════════════════════════════════════════════ */
function ClientsPage({ token }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/clients/all", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setClients(r.data.clients || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.user?.name || "").toLowerCase().includes(q) || (c.user?.email || "").toLowerCase().includes(q);
  });

  const GOAL_COLORS = { lose: "#ef4444", gain: "#10b981", maintain: "#0070f3", endurance: "#f59e0b", flexibility: "#8b5cf6" };
  const GOAL_LABELS = { lose: "Weight Loss", gain: "Muscle Gain", maintain: "Maintenance", endurance: "Endurance", flexibility: "Flexibility" };

  return (
    <div>
      <div className="adm-kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
        <KPICard label="Total Clients" value={clients.length} color="var(--adm-accent)" icon="👥" />
        <KPICard label="Active This Month" value={clients.filter(c => { const d = c.updatedAt || c.lastActive || c.user?.updatedAt; return d && new Date(d) > new Date(Date.now() - 30 * 864e5); }).length} color="var(--adm-green)" icon="🔥" />
        <KPICard label="Active Subscribers" value={clients.filter(c => c.subscriptionActive).length} color="var(--adm-gold)" icon="⭐" />
      </div>

      <div className="adm-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div className="adm-section-title" style={{ margin: 0 }}>All Clients</div>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />
        </div>

        {loading ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[1, 2, 3].map(i => <Skel key={i} h={48} />)}</div>
          : filtered.length === 0 ? <EmptyState icon="👤" text="No clients found." />
            : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Goal</th>
                      <th>Fitness Level</th>
                      <th>Weight</th>
                      <th>Programs</th>
                      <th>Subscription</th>
                      <th>Phone</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c._id} style={{ cursor: "pointer" }} onClick={() => setSelected(selected?._id === c._id ? null : c)}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div className="adm-avatar">{initial(c.user?.name)}</div>
                            <div>
                              <div style={{ color: "var(--adm-text)", fontWeight: 600, fontSize: 13 }}>{c.user?.name || "—"}</div>
                              <div style={{ fontSize: 11, color: "var(--adm-text3)" }}>{c.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {c.goalType ? (
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: `${GOAL_COLORS[c.goalType] || "#666"}18`, color: GOAL_COLORS[c.goalType] || "var(--adm-text2)" }}>
                              {GOAL_LABELS[c.goalType] || c.goalType}
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ textTransform: "capitalize" }}>{c.fitnessLevel || "—"}</td>
                        <td>
                          <span className="adm-mono" style={{ fontSize: 12 }}>
                            {c.currentWeight ? `${c.currentWeight} kg` : "—"}
                            {c.targetWeight ? <span style={{ color: "var(--adm-text3)" }}> → {c.targetWeight} kg</span> : ""}
                          </span>
                        </td>
                        <td><span className="adm-mono" style={{ color: "var(--adm-accent)" }}>{c.enrolledPrograms || 0}</span></td>
                        <td><StatusBadge status={c.subscriptionActive ? "active" : "inactive"} /></td>
                        <td style={{ fontSize: 12, color: "var(--adm-text2)" }}>{c.phone || c.user?.phone || "—"}</td>
                        <td style={{ fontSize: 12 }}>{fmtDate(c.createdAt || c.user?.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

        {/* Expanded row detail */}
        {selected && (
          <div style={{ marginTop: 16, padding: 18, background: "rgba(79,158,255,0.04)", border: "1px solid rgba(79,158,255,0.14)", borderRadius: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "var(--adm-text)" }}>
              {selected.user?.name} — Client Profile
            </div>
            <div className="adm-detail-grid">
              <div className="adm-detail-item"><div className="adm-detail-label">Age</div><div className="adm-detail-val">{selected.age || "—"}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Gender</div><div className="adm-detail-val" style={{ textTransform: "capitalize" }}>{selected.gender || "—"}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Height</div><div className="adm-detail-val">{selected.height ? `${selected.height} cm` : "—"}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Current Weight</div><div className="adm-detail-val">{selected.currentWeight ? `${selected.currentWeight} kg` : "—"}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Target Weight</div><div className="adm-detail-val">{selected.targetWeight ? `${selected.targetWeight} kg` : "—"}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Fitness Level</div><div className="adm-detail-val" style={{ textTransform: "capitalize" }}>{selected.fitnessLevel || "—"}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Goal</div><div className="adm-detail-val" style={{ textTransform: "capitalize" }}>{GOAL_LABELS[selected.goalType] || selected.goalType || "—"}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Workouts/Week</div><div className="adm-detail-val">{selected.workoutsPerWeek || "—"}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Subscription</div><div className="adm-detail-val"><StatusBadge status={selected.subscriptionActive ? "active" : "inactive"} /></div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Enrolled Programs</div><div className="adm-detail-val" style={{ color: "var(--adm-accent)" }}>{selected.enrolledPrograms || 0}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Phone</div><div className="adm-detail-val">{selected.phone || selected.user?.phone || "—"}</div></div>
              <div className="adm-detail-item"><div className="adm-detail-label">Joined</div><div className="adm-detail-val">{fmtDate(selected.createdAt || selected.user?.createdAt)}</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TRAINERS PAGE
═══════════════════════════════════════════════════════════════════════════════ */
function TrainersPage({ token }) {
  const [trainers, setTrainers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/trainers/all", { headers: { Authorization: `Bearer ${token}` } });
      setTrainers(r.data.trainers || []);
    } catch { }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const review = async (id, status) => {
    setActioning(id);
    try {
      await api.patch(`/trainers/${id}/review`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: "success", text: `Trainer ${status} successfully.` });
      load();
    } catch (e) { setMsg({ type: "error", text: e?.response?.data?.message || "Action failed." }); }
    finally { setActioning(null); }
  };

  const counts = {
    all: trainers.length,
    pending: trainers.filter(t => t.verificationStatus === "pending").length,
    approved: trainers.filter(t => t.verificationStatus === "approved").length,
    rejected: trainers.filter(t => t.verificationStatus === "rejected").length,
  };

  const filtered = trainers
    .filter(t => filter === "all" || t.verificationStatus === filter)
    .filter(t => {
      const q = search.toLowerCase();
      return !q || (t.user?.name || "").toLowerCase().includes(q) || (t.user?.email || "").toLowerCase().includes(q);
    });

  const totalRevenue = trainers.reduce((s, t) => s + (t.totalRevenue || 0), 0);
  const ratedTrainers = trainers.filter(t => t.avgRating > 0);
  const avgRating = ratedTrainers.length ? (ratedTrainers.reduce((s, t) => s + (t.avgRating || 0), 0) / ratedTrainers.length).toFixed(1) : "—";

  return (
    <div>
      <div className="adm-kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 24 }}>
        <KPICard label="Total Trainers" value={trainers.length} color="var(--adm-green)" icon="💪" />
        <KPICard label="Approved" value={counts.approved} color="var(--adm-green)" icon="✅" />
        <KPICard label="Total Revenue" value={fmtINR(totalRevenue)} color="var(--adm-gold)" icon="💰" />
        <KPICard label="Avg Rating" value={avgRating === "—" ? "—" : `${avgRating} ★`} color="var(--adm-gold)" icon="⭐" />
      </div>

      <div className="adm-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div className="adm-section-title" style={{ margin: 0 }}>Trainer Directory</div>
            <button className="adm-btn adm-btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={load}>↻ Refresh</button>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Search trainers…" />
        </div>

        <div className="adm-tabs">
          {["all", "pending", "approved", "rejected"].map(f => (
            <button key={f} className={`adm-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={{ marginLeft: 5, fontFamily: "'DM Mono',monospace", fontSize: 10, color: filter === f ? "var(--adm-accent)" : "var(--adm-text3)" }}>({counts[f]})</span>
            </button>
          ))}
        </div>

        {msg.text && <div className={`adm-alert ${msg.type}`}>{msg.text}</div>}

        {loading ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[1, 2, 3].map(i => <Skel key={i} h={56} />)}</div>
          : filtered.length === 0 ? <EmptyState icon="💪" text="No trainers found." />
            : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Trainer</th>
                      <th>Status</th>
                      <th>Programs</th>
                      <th>Active Clients</th>
                      <th>Monthly Completions</th>
                      <th>Avg Rating</th>
                      <th>Revenue</th>
                      <th>Certificate</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <>
                        <tr key={t._id} style={{ cursor: "pointer" }} onClick={() => setSelected(selected?._id === t._id ? null : t)}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div className="adm-avatar" style={{ background: "rgba(52,211,153,0.1)", color: "var(--adm-green)" }}>{initial(t.user?.name)}</div>
                              <div>
                                <div style={{ color: "var(--adm-text)", fontWeight: 600, fontSize: 13 }}>{t.user?.name || "—"}</div>
                                <div style={{ fontSize: 11, color: "var(--adm-text3)" }}>{t.user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><StatusBadge status={t.verificationStatus} /></td>
                          <td><span className="adm-mono" style={{ color: "var(--adm-accent)" }}>{t.totalPrograms || 0}</span></td>
                          <td><span className="adm-mono">{t.totalClients || 0}</span></td>
                          <td><span className="adm-mono">{t.monthlyCompletions || 0}</span></td>
                          <td><span className="adm-mono" style={{ color: "var(--adm-gold)" }}>{t.avgRating ? Number(t.avgRating).toFixed(1) : "—"}</span></td>
                          <td><span className="adm-mono" style={{ color: "var(--adm-green)", fontWeight: 600 }}>{fmtINR(t.totalRevenue || 0)}</span></td>
                          <td>
                            {t.certificateUrl
                              ? <a href={`${BASE_URL}${t.certificateUrl}`} target="_blank" rel="noreferrer" className="adm-cert-link" onClick={e => e.stopPropagation()}>📎 View</a>
                              : <span className="adm-no-cert">⚠ None</span>}
                          </td>
                          <td style={{ fontSize: 12, color: "var(--adm-text3)" }}>{fmtDate(t.createdAt || t.user?.createdAt)}</td>
                          <td onClick={e => e.stopPropagation()}>
                            {t.verificationStatus === "pending" && (
                              <div className="adm-row-action">
                                <button className="adm-btn adm-btn-success" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => review(t._id, "approved")} disabled={actioning === t._id}>✓ Approve</button>
                                <button className="adm-btn adm-btn-danger" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => review(t._id, "rejected")} disabled={actioning === t._id}>✕ Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {selected?._id === t._id && (
                          <tr key={`${t._id}-detail`}>
                            <td colSpan={10} style={{ padding: 0 }}>
                              <div style={{ margin: "4px 0 8px", padding: "16px 20px", background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.14)", borderRadius: 12 }}>
                                <div style={{ fontWeight: 700, marginBottom: 10 }}>{t.user?.name} — Full Profile</div>
                                {t.bio && <p style={{ fontSize: 13, color: "var(--adm-text2)", marginBottom: 10 }}>{t.bio}</p>}
                                <div className="adm-detail-grid">
                                  <div className="adm-detail-item"><div className="adm-detail-label">Specialties</div><div className="adm-detail-val">{(t.specialties || t.specialization)?.join(", ") || "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Experience</div><div className="adm-detail-val">{(t.experience || t.yearsOfExperience) ? `${t.experience || t.yearsOfExperience} yrs` : "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Phone</div><div className="adm-detail-val">{t.phone || t.user?.phone || "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">City</div><div className="adm-detail-val">{t.city || "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Total Programs</div><div className="adm-detail-val" style={{ color: "var(--adm-accent)" }}>{t.totalPrograms || 0}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Active Clients</div><div className="adm-detail-val">{t.totalClients || 0}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Monthly Completions</div><div className="adm-detail-val">{t.monthlyCompletions || 0}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Avg Rating</div><div className="adm-detail-val" style={{ color: "var(--adm-gold)" }}>{t.avgRating ? `${Number(t.avgRating).toFixed(1)} / 5` : "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Total Revenue</div><div className="adm-detail-val" style={{ color: "var(--adm-green)" }}>{fmtINR(t.totalRevenue || 0)}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Joined</div><div className="adm-detail-val">{fmtDate(t.createdAt || t.user?.createdAt)}</div></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   VENDORS PAGE
═══════════════════════════════════════════════════════════════════════════════ */
function VendorsPage({ token }) {
  const [vendors, setVendors] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [showReject, setShowReject] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/vendors/all", { headers: { Authorization: `Bearer ${token}` } });
      setVendors(r.data.vendors || []);
    } catch { }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const review = async (id, status) => {
    setActioning(id);
    try {
      await api.patch(`/vendors/${id}/review`, { status, rejectionReason: rejectReason[id] || "" }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: "success", text: `Vendor ${status} successfully.` });
      setShowReject(null);
      load();
    } catch (e) { setMsg({ type: "error", text: e?.response?.data?.message || "Action failed." }); }
    finally { setActioning(null); }
  };

  const counts = {
    all: vendors.length,
    pending: vendors.filter(v => v.verificationStatus === "pending").length,
    approved: vendors.filter(v => v.verificationStatus === "approved").length,
    rejected: vendors.filter(v => v.verificationStatus === "rejected").length,
  };

  const filtered = vendors
    .filter(v => filter === "all" || v.verificationStatus === filter)
    .filter(v => {
      const q = search.toLowerCase();
      return !q || (v.businessName || "").toLowerCase().includes(q) || (v.user?.name || "").toLowerCase().includes(q) || (v.user?.email || "").toLowerCase().includes(q);
    });

  const totalRevenue = vendors.reduce((s, v) => s + (v.totalRevenue || 0), 0);
  const totalProducts = vendors.reduce((s, v) => s + (v.totalProducts || 0), 0);

  return (
    <div>
      <div className="adm-kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 24 }}>
        <KPICard label="Total Vendors" value={vendors.length} color="var(--adm-purple)" icon="🏪" />
        <KPICard label="Approved Vendors" value={counts.approved} color="var(--adm-green)" icon="✅" />
        <KPICard label="Total Products" value={totalProducts} color="var(--adm-cyan)" icon="📦" />
        <KPICard label="Vendor Revenue" value={fmtINR(totalRevenue)} color="var(--adm-gold)" icon="💰" />
      </div>

      <div className="adm-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="adm-section-title" style={{ margin: 0 }}>Vendor Directory</div>
            <button className="adm-btn adm-btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={load}>↻ Refresh</button>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Search vendors…" />
        </div>

        <div className="adm-tabs">
          {["all", "pending", "approved", "rejected"].map(f => (
            <button key={f} className={`adm-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={{ marginLeft: 5, fontFamily: "'DM Mono',monospace", fontSize: 10, color: filter === f ? "var(--adm-accent)" : "var(--adm-text3)" }}>({counts[f]})</span>
            </button>
          ))}
        </div>

        {msg.text && <div className={`adm-alert ${msg.type}`}>{msg.text}</div>}

        {loading ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[1, 2, 3].map(i => <Skel key={i} h={56} />)}</div>
          : filtered.length === 0 ? <EmptyState icon="🏪" text="No vendors found." />
            : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Owner</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Products</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                      <th>GST</th>
                      <th>Certificate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(v => (
                      <>
                        <tr key={v._id} style={{ cursor: "pointer" }} onClick={() => setSelected(selected?._id === v._id ? null : v)}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div className="adm-avatar" style={{ background: "rgba(167,139,250,0.1)", color: "var(--adm-purple)" }}>{initial(v.businessName || v.user?.name)}</div>
                              <div style={{ color: "var(--adm-text)", fontWeight: 600, fontSize: 13 }}>{v.businessName || "—"}</div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 13 }}>{v.user?.name || "—"}</div>
                            <div style={{ fontSize: 11, color: "var(--adm-text3)" }}>{v.user?.email}</div>
                          </td>
                          <td style={{ fontSize: 12, textTransform: "capitalize" }}>{(v.businessType || "—").replace("_", " ")}</td>
                          <td style={{ fontSize: 12 }}>{v.city || "—"}</td>
                          <td><StatusBadge status={v.verificationStatus} /></td>
                          <td><span className="adm-mono" style={{ color: "var(--adm-cyan)" }}>{v.totalProducts || 0}</span></td>
                          <td><span className="adm-mono">{v.totalOrders || 0}</span></td>
                          <td><span className="adm-mono" style={{ color: "var(--adm-gold)", fontWeight: 600 }}>{fmtINR(v.totalRevenue)}</span></td>
                          <td style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "var(--adm-text3)" }}>{v.gstNumber || "—"}</td>
                          <td onClick={e => e.stopPropagation()}>
                            {v.certificateUrl
                              ? <a href={`${BASE_URL}${v.certificateUrl}`} target="_blank" rel="noreferrer" className="adm-cert-link">📄 View</a>
                              : <span className="adm-no-cert">⚠ None</span>}
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            {v.verificationStatus === "pending" && (
                              <div className="adm-row-action">
                                <button className="adm-btn adm-btn-success" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => review(v._id, "approved")} disabled={actioning === v._id}>✓ Approve</button>
                                <button className="adm-btn adm-btn-danger" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setShowReject(showReject === v._id ? null : v._id)} disabled={actioning === v._id}>✕ Reject</button>
                              </div>
                            )}
                            {v.verificationStatus === "rejected" && v.rejectionReason && (
                              <div style={{ fontSize: 11, color: "var(--adm-red)", maxWidth: 160 }}>{v.rejectionReason}</div>
                            )}
                          </td>
                        </tr>
                        {showReject === v._id && (
                          <tr key={`${v._id}-reject`}>
                            <td colSpan={11} style={{ padding: "0 0 8px" }}>
                              <div className="adm-inline-reason">
                                <input className="adm-input" placeholder="Reason for rejection (shown to vendor)…" value={rejectReason[v._id] || ""} onChange={e => setRejectReason(r => ({ ...r, [v._id]: e.target.value }))} style={{ flex: 1 }} />
                                <button className="adm-btn adm-btn-danger" onClick={() => review(v._id, "rejected")} disabled={actioning === v._id}>Confirm Reject</button>
                                <button className="adm-btn adm-btn-ghost" onClick={() => setShowReject(null)}>Cancel</button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {selected?._id === v._id && (
                          <tr key={`${v._id}-detail`}>
                            <td colSpan={11} style={{ padding: 0 }}>
                              <div style={{ margin: "4px 0 8px", padding: "16px 20px", background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.14)", borderRadius: 12 }}>
                                <div style={{ fontWeight: 700, marginBottom: 10 }}>{v.businessName} — Vendor Profile</div>
                                {v.description && <p style={{ fontSize: 13, color: "var(--adm-text2)", marginBottom: 10 }}>{v.description}</p>}
                                <div className="adm-detail-grid">
                                  <div className="adm-detail-item"><div className="adm-detail-label">Owner Name</div><div className="adm-detail-val">{v.user?.name || "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Email</div><div className="adm-detail-val">{v.user?.email || "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Phone</div><div className="adm-detail-val">{v.phone || "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">City</div><div className="adm-detail-val">{v.city || "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Business Type</div><div className="adm-detail-val" style={{ textTransform: "capitalize" }}>{(v.businessType || "—").replace("_", " ")}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">GST Number</div><div className="adm-detail-val adm-mono">{v.gstNumber || "—"}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Total Products</div><div className="adm-detail-val" style={{ color: "var(--adm-cyan)" }}>{v.totalProducts || 0}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Total Orders</div><div className="adm-detail-val">{v.totalOrders || 0}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Total Revenue</div><div className="adm-detail-val" style={{ color: "var(--adm-gold)" }}>{fmtINR(v.totalRevenue)}</div></div>
                                  <div className="adm-detail-item"><div className="adm-detail-label">Joined</div><div className="adm-detail-val">{fmtDate(v.createdAt || v.user?.createdAt)}</div></div>
                                  {v.rejectionReason && <div className="adm-detail-item" style={{ borderColor: "rgba(248,113,113,0.2)" }}><div className="adm-detail-label" style={{ color: "var(--adm-red)" }}>Rejection Reason</div><div className="adm-detail-val" style={{ color: "var(--adm-red)" }}>{v.rejectionReason}</div></div>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   VERIFICATION QUEUE PAGE  (dedicated fast-action view)
═══════════════════════════════════════════════════════════════════════════════ */
function VerificationPage({ token, onRefreshCounts }) {
  const [trainers, setTrainers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [showReject, setShowReject] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, vRes] = await Promise.all([
        api.get("/trainers/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { trainers: [] } })),
        api.get("/vendors/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { vendors: [] } })),
      ]);
      setTrainers((tRes.data.trainers || []).filter(t => t.verificationStatus === "pending"));
      setVendors((vRes.data.vendors || []).filter(v => v.verificationStatus === "pending"));
    } catch { }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const reviewTrainer = async (id, status) => {
    setActioning(id);
    try {
      await api.patch(`/trainers/${id}/review`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: "success", text: `Trainer ${status}.` });
      load(); onRefreshCounts?.();
    } catch (e) { setMsg({ type: "error", text: e?.response?.data?.message || "Failed." }); }
    finally { setActioning(null); }
  };

  const reviewVendor = async (id, status) => {
    setActioning(id);
    try {
      await api.patch(`/vendors/${id}/review`, { status, rejectionReason: rejectReason[id] || "" }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: "success", text: `Vendor ${status}.` });
      setShowReject(null);
      load(); onRefreshCounts?.();
    } catch (e) { setMsg({ type: "error", text: e?.response?.data?.message || "Failed." }); }
    finally { setActioning(null); }
  };

  const total = trainers.length + vendors.length;

  return (
    <div>
      {msg.text && <div className={`adm-alert ${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

      {loading ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1, 2, 3].map(i => <Skel key={i} h={80} />)}</div>
        : total === 0 ? (
          <div className="adm-card" style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--adm-text)" }}>All clear!</div>
            <div style={{ color: "var(--adm-text3)", marginTop: 6, fontSize: 13 }}>No pending verifications.</div>
          </div>
        ) : (
          <>
            {/* Trainer queue */}
            {trainers.length > 0 && (
              <div className="adm-card" style={{ marginBottom: 16 }}>
                <div className="adm-section-title">💪 Trainer Applications ({trainers.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trainers.map(t => (
                    <div key={t._id} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--adm-border)", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
                          <div className="adm-avatar" style={{ background: "rgba(52,211,153,0.1)", color: "var(--adm-green)", marginTop: 2 }}>{initial(t.user?.name)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--adm-text)" }}>{t.user?.name || "Unknown"}</div>
                            <div style={{ fontSize: 12, color: "var(--adm-text3)", marginTop: 2 }}>{t.user?.email}</div>
                            {t.bio && <div style={{ fontSize: 12, color: "var(--adm-text2)", marginTop: 6, maxWidth: 480 }}>{t.bio}</div>}
                            <div className="adm-detail-grid" style={{ marginTop: 10, gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))" }}>
                              {(t.specialties || t.specialization)?.length > 0 && <div className="adm-detail-item"><div className="adm-detail-label">Specialties</div><div className="adm-detail-val" style={{ fontSize: 12 }}>{(t.specialties || t.specialization).join(", ")}</div></div>}
                              {(t.experience || t.yearsOfExperience) > 0 && <div className="adm-detail-item"><div className="adm-detail-label">Experience</div><div className="adm-detail-val">{t.experience || t.yearsOfExperience} yrs</div></div>}
                              {t.city && <div className="adm-detail-item"><div className="adm-detail-label">City</div><div className="adm-detail-val">{t.city}</div></div>}
                            </div>
                            <div style={{ marginTop: 10 }}>
                              {t.certificateUrl
                                ? <a href={`${BASE_URL}${t.certificateUrl}`} target="_blank" rel="noreferrer" className="adm-cert-link">📎 View Certificate</a>
                                : <span className="adm-no-cert">⚠ No certificate uploaded</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button className="adm-btn adm-btn-success" onClick={() => reviewTrainer(t._id, "approved")} disabled={actioning === t._id}>✓ Approve</button>
                          <button className="adm-btn adm-btn-danger" onClick={() => reviewTrainer(t._id, "rejected")} disabled={actioning === t._id}>✕ Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor queue */}
            {vendors.length > 0 && (
              <div className="adm-card">
                <div className="adm-section-title">🏪 Vendor Applications ({vendors.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {vendors.map(v => (
                    <div key={v._id} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--adm-border)", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
                          <div className="adm-avatar" style={{ background: "rgba(167,139,250,0.1)", color: "var(--adm-purple)", marginTop: 2 }}>{initial(v.businessName || v.user?.name)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--adm-text)" }}>{v.businessName || "Business name not set"}</div>
                            <div style={{ fontSize: 12, color: "var(--adm-text3)", marginTop: 2 }}>{v.user?.name} · {v.user?.email}</div>
                            {v.description && <div style={{ fontSize: 12, color: "var(--adm-text2)", marginTop: 6, maxWidth: 480 }}>{v.description}</div>}
                            <div className="adm-detail-grid" style={{ marginTop: 10, gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))" }}>
                              {v.businessType && <div className="adm-detail-item"><div className="adm-detail-label">Type</div><div className="adm-detail-val" style={{ textTransform: "capitalize" }}>{v.businessType.replace("_", " ")}</div></div>}
                              {v.city && <div className="adm-detail-item"><div className="adm-detail-label">City</div><div className="adm-detail-val">{v.city}</div></div>}
                              {v.phone && <div className="adm-detail-item"><div className="adm-detail-label">Phone</div><div className="adm-detail-val">{v.phone}</div></div>}
                              {v.gstNumber && <div className="adm-detail-item"><div className="adm-detail-label">GST</div><div className="adm-detail-val adm-mono" style={{ fontSize: 11 }}>{v.gstNumber}</div></div>}
                            </div>
                            <div style={{ marginTop: 10 }}>
                              {v.certificateUrl
                                ? <a href={`${BASE_URL}${v.certificateUrl}`} target="_blank" rel="noreferrer" className="adm-cert-link">📄 View License / Certificate</a>
                                : <span className="adm-no-cert">⚠ No certificate uploaded</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button className="adm-btn adm-btn-success" onClick={() => reviewVendor(v._id, "approved")} disabled={actioning === v._id}>✓ Approve</button>
                          <button className="adm-btn adm-btn-danger" onClick={() => setShowReject(showReject === v._id ? null : v._id)} disabled={actioning === v._id}>✕ Reject</button>
                        </div>
                      </div>
                      {showReject === v._id && (
                        <div className="adm-inline-reason">
                          <input className="adm-input" placeholder="Reason for rejection (shown to vendor)…" value={rejectReason[v._id] || ""} onChange={e => setRejectReason(r => ({ ...r, [v._id]: e.target.value }))} style={{ flex: 1 }} />
                          <button className="adm-btn adm-btn-danger" onClick={() => reviewVendor(v._id, "rejected")} disabled={actioning === v._id}>Confirm</button>
                          <button className="adm-btn adm-btn-ghost" onClick={() => setShowReject(null)}>Cancel</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REVENUE / FINANCE PAGE
═══════════════════════════════════════════════════════════════════════════════ */
function RevenuePage({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, vRes] = await Promise.all([
          api.get("/trainers/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { trainers: [] } })),
          api.get("/vendors/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { vendors: [] } })),
        ]);
        const allTrainers = tRes.data.trainers || [];
        const allVendors = vRes.data.vendors || [];
        const getTrainerRev = t => t.totalRevenue || 0;
        const getVendorRev = v => v.totalRevenue || 0;
        const trainers = allTrainers.filter(t => getTrainerRev(t) > 0).sort((a, b) => getTrainerRev(b) - getTrainerRev(a));
        const vendors = allVendors.filter(v => getVendorRev(v) > 0).sort((a, b) => getVendorRev(b) - getVendorRev(a));
        const trainerTotal = allTrainers.reduce((s, t) => s + getTrainerRev(t), 0);
        const vendorTotal = allVendors.reduce((s, v) => s + getVendorRev(v), 0);
        const grossTotal = trainerTotal + vendorTotal;
        const platformTotal = Math.round(grossTotal * 0.15);
        setData({ trainers, vendors, trainerTotal, vendorTotal, grossTotal, platformTotal, getTrainerRev, getVendorRev });
      } catch { }
      finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[1, 2, 3].map(i => <Skel key={i} h={80} />)}</div>;

  const grandTotal = data?.grossTotal || 0;
  const platformCut = data?.platformTotal || 0;

  return (
    <div>
      <div className="adm-kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
        <KPICard label="Platform Revenue (15%)" value={fmtINR(platformCut)} color="var(--adm-gold)" icon="💰" />
        <KPICard label="Trainer Gross Revenue" value={fmtINR(data?.trainerTotal)} color="var(--adm-green)" icon="💪" />
        <KPICard label="Vendor Gross Revenue" value={fmtINR(data?.vendorTotal)} color="var(--adm-purple)" icon="🏪" />
      </div>
      <div style={{ marginBottom: 16, padding: "10px 16px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 10, fontSize: 12, color: "var(--adm-text2)" }}>
        💡 <strong style={{ color: "var(--adm-gold)" }}>Total Gross Transacted:</strong> {fmtINR(grandTotal)} — Platform earns 15% ({fmtINR(platformCut)}) from all transactions.
      </div>

      <div className="adm-grid-2">
        <div className="adm-card">
          <div className="adm-section-title">Top Earning Trainers</div>
          {data?.trainers.length === 0 ? <EmptyState icon="💸" text="No trainer revenue yet." /> : (
            <table className="adm-table">
              <thead><tr><th>#</th><th>Trainer</th><th>Programs</th><th>Clients</th><th>Revenue</th></tr></thead>
              <tbody>
                {(data?.trainers || []).map((t, i) => (
                  <tr key={t._id}>
                    <td><span className="adm-mono" style={{ color: i === 0 ? "var(--adm-gold)" : "var(--adm-text3)", fontWeight: 700 }}>#{i + 1}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="adm-avatar" style={{ background: "rgba(52,211,153,0.1)", color: "var(--adm-green)", width: 28, height: 28, fontSize: 11 }}>{initial(t.user?.name)}</div>
                        <div>
                          <div style={{ color: "var(--adm-text)", fontSize: 13, fontWeight: 600 }}>{t.user?.name || "—"}</div>
                          <div style={{ fontSize: 11, color: "var(--adm-text3)" }}>{t.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="adm-mono">{t.totalPrograms || 0}</span></td>
                    <td><span className="adm-mono">{t.totalClients || 0}</span></td>
                    <td><span className="adm-mono" style={{ color: "var(--adm-green)", fontWeight: 700 }}>{fmtINR(data?.getTrainerRev ? data.getTrainerRev(t) : (t.totalRevenue || t.revenue || 0))}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="adm-card">
          <div className="adm-section-title">Top Earning Vendors</div>
          {data?.vendors.length === 0 ? <EmptyState icon="💸" text="No vendor revenue yet." /> : (
            <table className="adm-table">
              <thead><tr><th>#</th><th>Business</th><th>Orders</th><th>Products</th><th>Revenue</th></tr></thead>
              <tbody>
                {(data?.vendors || []).map((v, i) => (
                  <tr key={v._id}>
                    <td><span className="adm-mono" style={{ color: i === 0 ? "var(--adm-gold)" : "var(--adm-text3)", fontWeight: 700 }}>#{i + 1}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="adm-avatar" style={{ background: "rgba(167,139,250,0.1)", color: "var(--adm-purple)", width: 28, height: 28, fontSize: 11 }}>{initial(v.businessName || v.user?.name)}</div>
                        <div>
                          <div style={{ color: "var(--adm-text)", fontSize: 13, fontWeight: 600 }}>{v.businessName || "—"}</div>
                          <div style={{ fontSize: 11, color: "var(--adm-text3)" }}>{v.businessType?.replace("_", " ")} · {v.city}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="adm-mono">{v.totalOrders || 0}</span></td>
                    <td><span className="adm-mono">{v.totalProducts || 0}</span></td>
                    <td><span className="adm-mono" style={{ color: "var(--adm-gold)", fontWeight: 700 }}>{fmtINR(data?.getVendorRev ? data.getVendorRev(v) : (v.totalRevenue || v.revenue || 0))}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
═══════════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [page, setPage] = useState("overview");
  const [pendingCounts, setPendingCounts] = useState({ trainers: 0, vendors: 0 });

  injectStyles();

  const refreshCounts = useCallback(async () => {
    try {
      const [tRes, vRes] = await Promise.all([
        api.get("/trainers/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { trainers: [] } })),
        api.get("/vendors/all", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { vendors: [] } })),
      ]);
      setPendingCounts({
        trainers: (tRes.data.trainers || []).filter(t => t.verificationStatus === "pending").length,
        vendors: (vRes.data.vendors || []).filter(v => v.verificationStatus === "pending").length,
      });
    } catch { }
  }, [token]);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  const totalPending = pendingCounts.trainers + pendingCounts.vendors;

  const NAV = [
    { section: "Platform" },
    { key: "overview", icon: "⬡", label: "Overview" },
    { key: "revenue", icon: "💰", label: "Revenue & Finance" },
    { section: "Users" },
    { key: "clients", icon: "👥", label: "Clients" },
    { key: "trainers", icon: "💪", label: "Trainers" },
    { key: "vendors", icon: "🏪", label: "Vendors" },
    { section: "Operations" },
    { key: "verification", icon: "🔍", label: "Verification Queue", badge: totalPending || null },
  ];

  const PAGE_TITLES = {
    overview: { title: "Dashboard Overview", sub: "Platform-wide summary and recent activity" },
    revenue: { title: "Revenue & Finance", sub: "Earnings by trainers and vendors" },
    clients: { title: "Clients", sub: "All registered clients and their profiles" },
    trainers: { title: "Trainers", sub: "Trainer directory, applications and performance" },
    vendors: { title: "Vendors", sub: "Vendor directory, applications and store data" },
    verification: { title: "Verification Queue", sub: "Pending trainer and vendor applications" },
  };

  return (
    <div className="adm-root">
      <div className="adm-layout">
        {/* Topbar */}
        <div className="adm-topbar">
          <div className="adm-logo">
            <div className="adm-logo-dot" />
            FlexAdmin
          </div>
          <div className="adm-topbar-right">
            {totalPending > 0 && (
              <div style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 11, fontWeight: 700, color: "var(--adm-gold)" }}>
                ⏳ {totalPending} pending review{totalPending > 1 ? "s" : ""}
              </div>
            )}
            <div className="adm-admin-pill">
              <div className="adm-admin-avatar">{initial(user?.name)}</div>
              {user?.name || "Admin"}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="adm-sidebar">
          {NAV.map((item, i) => {
            if (item.section) return <div key={i} className="adm-nav-section">{item.section}</div>;
            return (
              <button key={item.key} className={`adm-nav-btn ${page === item.key ? "active" : ""}`} onClick={() => setPage(item.key)}>
                <div className="adm-nav-icon">{item.icon}</div>
                {item.label}
                {item.badge ? <span className="adm-badge">{item.badge}</span> : null}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div className="adm-content">
          <div className="adm-page-head">
            <div className="adm-page-title">{PAGE_TITLES[page]?.title}</div>
            <div className="adm-page-sub">{PAGE_TITLES[page]?.sub}</div>
          </div>

          {page === "overview" && <OverviewPage token={token} pendingTrainers={pendingCounts.trainers} pendingVendors={pendingCounts.vendors} />}
          {page === "revenue" && <RevenuePage token={token} />}
          {page === "clients" && <ClientsPage token={token} />}
          {page === "trainers" && <TrainersPage token={token} />}
          {page === "vendors" && <VendorsPage token={token} />}
          {page === "verification" && <VerificationPage token={token} onRefreshCounts={refreshCounts} />}
        </div>
      </div>
    </div>
  );
}