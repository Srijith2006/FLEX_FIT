import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

// Custom dark tooltip
const DarkTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border2)",
      borderRadius: "10px", padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      <div style={{ fontSize: "11px", color: "var(--text3)", marginBottom: "6px" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: "13px", fontWeight: 700, color: p.color }}>
          {prefix}{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}{suffix}
          <span style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 400, marginLeft: "4px" }}>
            {p.name}
          </span>
        </div>
      ))}
    </div>
  );
};

// Heatmap cell
function HeatCell({ count, date }) {
  const intensity = count === 0 ? 0 : count === 1 ? 0.3 : count <= 3 ? 0.6 : 1;
  const d = new Date(date + "T12:00:00");
  const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return (
    <div
      title={`${label}: ${count} completion${count !== 1 ? "s" : ""}`}
      style={{
        width: "14px", height: "14px", borderRadius: "3px",
        background: intensity === 0
          ? "var(--border)"
          : `rgba(0,229,255,${intensity})`,
        transition: "transform 0.1s",
        cursor: "default",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
    />
  );
}

function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days/7)}w ago`;
  return `${Math.floor(days/30)}mo ago`;
}

export default function TrainerAnalytics() {
  const { token } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/trainers/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="card loading-screen" style={{ minHeight: "200px" }}>
      <div className="spinner"></div>
    </div>
  );

  if (!data) return null;

  const totalRevenue = data.revenueChart.reduce((s, m) => s + m.revenue, 0);
  const totalNewClients = data.revenueChart.reduce((s, m) => s + m.clients, 0);
  const bestMonth = [...data.revenueChart].sort((a,b) => b.revenue - a.revenue)[0];
  const maxHeat   = Math.max(...data.heatmapData.map(d => d.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Revenue & Clients — 6 month combo chart ──────────────────── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px" }}>📈 Revenue & New Clients</div>
            <div style={{ fontSize: "12px", color: "var(--text3)" }}>Last 6 months</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "26px", color: "var(--green)", lineHeight: 1 }}>
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>
              {totalNewClients} new clients · Best: {bestMonth?.month} (₹{bestMonth?.revenue?.toLocaleString("en-IN") || 0})
            </div>
          </div>
        </div>

        {totalRevenue === 0 ? (
          <div className="empty-state" style={{ padding: "32px" }}>
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">Revenue data will appear here as clients enroll in your programs.</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.revenueChart} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "var(--text3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" tick={{ fill: "var(--text3)", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
              <YAxis yAxisId="cli" orientation="right" tick={{ fill: "var(--text3)", fontSize: 10 }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip prefix="₹" />} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "var(--text3)" }} />
              <Bar yAxisId="rev" dataKey="revenue" name="Revenue (₹)" fill="var(--accent2)"
                radius={[4,4,0,0]} maxBarSize={32} />
              <Bar yAxisId="cli" dataKey="clients" name="New Clients" fill="var(--green)"
                radius={[4,4,0,0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Program enrollment comparison ────────────────────────────── */}
      {data.programChart.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>🏆 Program Performance</div>
          <div style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "16px" }}>Enrollments per program</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.programChart.map((p, i) => {
              const maxEnrolled = Math.max(...data.programChart.map(x => x.enrolled), 1);
              const pct = Math.round((p.enrolled / maxEnrolled) * 100);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{p.name}</span>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <span style={{ color: "var(--accent2)", fontWeight: 700 }}>
                        {p.enrolled} enrolled
                      </span>
                      <span style={{ color: "var(--green)" }}>
                        ₹{p.revenue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: "8px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: i === 0
                        ? "linear-gradient(90deg,var(--accent2),var(--accent))"
                        : i === 1
                        ? "linear-gradient(90deg,var(--accent3),var(--accent2))"
                        : "var(--border2)",
                      borderRadius: "4px",
                      transition: "width 0.8s ease",
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Client completion heatmap ────────────────────────────────── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px" }}>🔥 Client Activity Heatmap</div>
            <div style={{ fontSize: "12px", color: "var(--text3)" }}>Workout completions — last 28 days</div>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "10px", color: "var(--text3)" }}>
            <span>Less</span>
            {[0, 0.3, 0.6, 1].map(i => (
              <div key={i} style={{ width: "12px", height: "12px", borderRadius: "3px",
                background: i === 0 ? "var(--border)" : `rgba(0,229,255,${i})` }}/>
            ))}
            <span>More</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
          {data.heatmapData.map(d => (
            <HeatCell key={d.date} count={d.count} date={d.date} />
          ))}
        </div>

        {/* Week labels */}
        <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ width: "14px", fontSize: "8px", color: "var(--text3)",
              textAlign: "center" }}>{d[0]}</div>
          ))}
        </div>

        <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text3)" }}>
          Total completions: <strong style={{ color: "var(--accent)" }}>
            {data.heatmapData.reduce((s, d) => s + d.count, 0)}
          </strong> in the last 28 days
        </div>
      </div>

      {/* ── Client list ───────────────────────────────────────────────── */}
      {data.clientList.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>👥 Active Clients</div>
          <div style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "14px" }}>
            Engagement & progress overview
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.clientList.map((client, i) => {
              const activityColor = (() => {
                const days = Math.floor((Date.now() - new Date(client.lastActive)) / 86400000);
                if (days <= 1)  return "var(--green)";
                if (days <= 7)  return "var(--accent2)";
                if (days <= 14) return "var(--gold)";
                return "var(--red)";
              })();

              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 14px", background: "var(--bg3)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius)",
                }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "12px", flexShrink: 0,
                    background: "linear-gradient(135deg,var(--accent2),var(--accent3))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Bebas Neue',sans-serif", fontSize: "16px", color: "#fff",
                  }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>{client.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>
                      {client.program}
                    </div>
                  </div>

                  {/* Completions badge */}
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "20px",
                      color: "var(--accent)", lineHeight: 1 }}>
                      {client.completions}
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text3)", textTransform: "uppercase" }}>
                      workouts
                    </div>
                  </div>

                  {/* Body weight */}
                  {client.bodyWeight > 0 && (
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "20px",
                        color: "var(--text2)", lineHeight: 1 }}>
                        {client.bodyWeight}kg
                      </div>
                      <div style={{ fontSize: "9px", color: "var(--text3)", textTransform: "uppercase" }}>
                        weight
                      </div>
                    </div>
                  )}

                  {/* Last active */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: activityColor }}>
                      ● {daysSince(client.lastActive)}
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text3)" }}>last active</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}