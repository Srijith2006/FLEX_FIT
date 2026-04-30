import { Link } from "react-router-dom";

const FEATURES = [
  { icon: "🏆", label: "Verified Trainers", desc: "Every trainer is credential-reviewed by our admin team before they can coach.", bg: "icon-gold" },
  { icon: "📊", label: "Progress Tracking", desc: "Log workouts, weight, and notes. Visualize your momentum over time.", bg: "icon-cyan" },
  { icon: "💬", label: "Async Coaching", desc: "Get personalized programs delivered on your schedule — no live sessions needed.", bg: "icon-blue" },
  { icon: "🥗", label: "Diet Planning", desc: "Trainers create custom nutrition plans tailored to your goals.", bg: "icon-green" },
  { icon: "⭐", label: "Ratings & Reviews", desc: "Rate your trainer after each program and help others make informed decisions.", bg: "icon-gold" },
  { icon: "🔒", label: "Secure Payments", desc: "Stripe-powered payments with transparent pricing and no hidden fees.", bg: "icon-purple" },
];

export default function Home() {
  return (
    <div>
      {/* ─ HERO ─ */}
      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="hero-grid-lines"></div>
        <div className="container hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot"></span>
            Async Fitness Coaching Platform
          </div>
          <h1 className="hero-title">
            TRAIN<br />
            SMARTER.<br />
            <span className="hero-title-accent">PERFORM</span><br />
            BETTER.
          </h1>
          <p className="hero-desc">
            Connect with elite, verified personal trainers. Get structured workout programs,
            nutrition guidance, and measurable results — on your schedule.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-accent btn-lg">Start For Free →</Link>
            <Link to="/pricing" className="btn btn-outline btn-lg">See Pricing</Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-item">
              <span className="hero-stat-num">500<span>+</span></span>
              <span className="hero-stat-label">Verified Trainers</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-num">12<span>k</span></span>
              <span className="hero-stat-label">Active Clients</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-num">98<span>%</span></span>
              <span className="hero-stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─ FEATURES ─ */}
      <section className="features-section" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 className="section-title" style={{ fontSize: "48px", textAlign: "center" }}>
              EVERYTHING YOU NEED
            </h2>
            <p className="section-sub" style={{ textAlign: "center" }}>
              A complete fitness coaching ecosystem in one platform
            </p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f) => (
              <div key={f.label} className="feature-card">
                <div className={`feature-icon ${f.bg}`}>{f.icon}</div>
                <div className="feature-title">{f.label}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─ CTA BANNER ─ */}
      <section style={{ padding: "80px 0", background: "linear-gradient(135deg, rgba(0,112,243,0.08), rgba(124,58,237,0.06))", borderTop: "1px solid var(--border)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="font-heading" style={{ fontSize: "52px", letterSpacing: "2px", marginBottom: "14px" }}>
            READY TO TRANSFORM?
          </h2>
          <p style={{ color: "var(--text2)", fontSize: "16px", marginBottom: "32px" }}>
            Join as a client or list yourself as a verified trainer today.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register?role=client" className="btn btn-accent btn-lg">I'm a Client</Link>
            <Link to="/register?role=trainer" className="btn btn-outline btn-lg">I'm a Trainer</Link>
          </div>
        </div>
      </section>
    </div>
  );
}