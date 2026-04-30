import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

const ROLES = [
  { value: "client", label: "Client", icon: "🏃", desc: "Find trainers & track progress" },
  { value: "trainer", label: "Trainer", icon: "💪", desc: "Offer coaching & build clients" },
];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await register(form);
      nav("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">FLEX<span style={{ color: "var(--accent)" }}>FIT</span></div>
        <p className="auth-tagline">Join thousands transforming their fitness.</p>

        <form onSubmit={submit} className="auth-form-stack">
          {/* Role Selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {ROLES.map((r) => (
              <div
                key={r.value}
                onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                style={{
                  border: `1px solid ${form.role === r.value ? "var(--accent2)" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  padding: "14px",
                  cursor: "pointer",
                  background: form.role === r.value ? "rgba(0,112,243,0.08)" : "var(--bg3)",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: "22px", marginBottom: "6px" }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{r.label}</div>
                <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>{r.desc}</div>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" required placeholder="Alex Johnson" value={form.name} onChange={handle("name")} />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" required placeholder="you@example.com" value={form.email} onChange={handle("email")} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required placeholder="Min. 6 characters" value={form.password} onChange={handle("password")} />
          </div>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <button className="btn btn-accent btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Creating account…</> : "Create Free Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}