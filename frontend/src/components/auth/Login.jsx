import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      nav("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">FLEX<span style={{ color: "var(--accent)" }}>FIT</span></div>
        <p className="auth-tagline">Your performance journey starts here.</p>

        <form onSubmit={submit} className="auth-form-stack">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={handle("email")}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={handle("password")}
            />
          </div>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <button className="btn btn-accent btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" style={{borderTopColor:"#fff"}}></span> Signing in…</> : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          No account? <Link to="/register">Create one free →</Link>
        </p>
      </div>
    </div>
  );
}