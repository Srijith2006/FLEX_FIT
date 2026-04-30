import { useEffect, useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

export default function ClientOverview() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, logsRes, enrollRes] = await Promise.all([
          api.get("/clients/me",          { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/workouts/logs/mine",   { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/programs/enrolled",    { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const client      = profileRes.data.client;
        const logs        = logsRes.data.logs || [];
        const enrollments = enrollRes.data.enrollments || [];

        // Streak: consecutive days with logs up to today
        const logDates = new Set(logs.map(l =>
          new Date(l.date || l.createdAt).toISOString().split("T")[0]
        ));
        let streak = 0;
        const d = new Date();
        while (logDates.has(d.toISOString().split("T")[0])) {
          streak++;
          d.setDate(d.getDate() - 1);
        }

        // Weight change
        const weights = logs.filter(l => l.weight > 0).map(l => l.weight);
        const latestWeight  = weights[0]  ?? client.currentWeight ?? 0;
        const earliestWeight = weights[weights.length - 1] ?? latestWeight;
        const weightChange  = latestWeight && earliestWeight
          ? (latestWeight - earliestWeight).toFixed(1)
          : null;

        setStats({
          streak,
          totalLogs:       logs.length,
          activePrograms:  enrollments.length,
          currentWeight:   latestWeight || client.currentWeight || 0,
          targetWeight:    client.targetWeight || 0,
          goalType:        client.goalType || "maintain",
          fitnessLevel:    client.fitnessLevel || "beginner",
          weightChange,
          recentLogs:      logs.slice(0, 3),
          enrollments,
          profileComplete: !!(client.age && client.gender && client.height && client.currentWeight),
        });
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div className="card loading-screen" style={{ minHeight: "200px" }}>
      <div className="spinner"></div>
    </div>
  );

  if (!stats) return null;

  const goalLabel = {
    lose: "Lose Weight 🔥", gain: "Gain Muscle 💪",
    maintain: "Maintain 🎯", endurance: "Endurance 🏃", flexibility: "Flexibility 🤸",
  }[stats.goalType] || "—";

  const weightProgress = stats.currentWeight && stats.targetWeight
    ? Math.min(100, Math.max(0, Math.round(
        stats.goalType === "lose"
          ? ((stats.currentWeight - stats.targetWeight) <= 0 ? 100 :
              Math.max(0, 100 - ((stats.currentWeight - stats.targetWeight) / stats.currentWeight * 100)))
          : stats.goalType === "gain"
          ? Math.min(100, ((stats.currentWeight / stats.targetWeight) * 100))
          : 100
      )))
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Profile incomplete warning */}
      {!stats.profileComplete && (
        <div className="alert alert-info" style={{ gap: "10px" }}>
          👋 Complete your profile to get the most out of FlexFit — add your age, height, and current weight.
        </div>
      )}

      {/* Top stat cards */}
      <div className="grid-3">
        <div className="stat-card">
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>🔥</div>
          <div className="stat-card-value" style={{ color: "var(--accent)" }}>
            {stats.streak}
          </div>
          <div className="stat-card-label">day streak</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>🏋️</div>
          <div className="stat-card-value" style={{ color: "var(--green)" }}>
            {stats.totalLogs}
          </div>
          <div className="stat-card-label">workouts logged</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>📚</div>
          <div className="stat-card-value" style={{ color: "var(--gold)" }}>
            {stats.activePrograms}
          </div>
          <div className="stat-card-label">active programs</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Weight card */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}>⚖️ Weight Tracker</div>
          <div style={{ display: "flex", gap: "20px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px", color: "var(--accent)", lineHeight: 1 }}>
                {stats.currentWeight > 0 ? `${stats.currentWeight}` : "—"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current kg</div>
            </div>
            {stats.targetWeight > 0 && (
              <>
                <div style={{ color: "var(--border)", fontSize: "28px", alignSelf: "center" }}>→</div>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "36px", color: "var(--text2)", lineHeight: 1 }}>
                    {stats.targetWeight}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Target kg</div>
                </div>
              </>
            )}
          </div>
          {stats.weightChange !== null && (
            <div style={{ fontSize: "13px", color: Number(stats.weightChange) < 0 ? "var(--green)" : "var(--gold)", marginBottom: "10px" }}>
              {Number(stats.weightChange) > 0 ? "+" : ""}{stats.weightChange} kg since you started
            </div>
          )}
          {stats.targetWeight > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text3)", marginBottom: "5px" }}>
                <span>Progress to goal</span><span>{weightProgress}%</span>
              </div>
              <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${weightProgress}%`, background: "linear-gradient(90deg,var(--accent2),var(--accent))", borderRadius: "3px", transition: "width 0.5s" }} />
              </div>
            </>
          )}
        </div>

        {/* Goal & level card */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}>🎯 My Goals</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text2)" }}>Primary Goal</span>
              <span style={{ fontWeight: 700, fontSize: "13px" }}>{goalLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text2)" }}>Fitness Level</span>
              <span className="tag tag-active" style={{ textTransform: "capitalize" }}>{stats.fitnessLevel}</span>
            </div>
            {stats.activePrograms > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--text2)" }}>Active Programs</span>
                <span style={{ fontWeight: 700, color: "var(--green)" }}>{stats.activePrograms} enrolled</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent workouts */}
      {stats.recentLogs.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}>🕐 Recent Workouts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {stats.recentLogs.map((log, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text3)" }}>
                    {new Date(log.date || log.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  {log.completedExercises?.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                      {log.completedExercises.slice(0, 3).map((ex, ei) => (
                        <span key={ei} className="spec-tag" style={{ fontSize: "10px" }}>{ex.name}</span>
                      ))}
                      {log.completedExercises.length > 3 && (
                        <span style={{ fontSize: "10px", color: "var(--text3)" }}>+{log.completedExercises.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
                {log.weight > 0 && (
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "var(--text2)" }}>
                    {log.weight}kg
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active programs */}
      {stats.enrollments.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}>📚 My Programs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {stats.enrollments.map(e => (
              <div key={e._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{e.program?.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text3)" }}>
                    by {e.program?.trainer?.user?.name} · {e.program?.durationWeeks}w
                  </div>
                </div>
                <span className="tag tag-approved">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
