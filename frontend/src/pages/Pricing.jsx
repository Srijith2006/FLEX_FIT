import { Link } from "react-router-dom";

const CLIENT_FEATURES = [
  "Browse all verified trainers",
  "Request custom workout programs",
  "Unlimited workout logging",
  "Diet plan access",
  "Progress tracking dashboard",
  "Rate & review trainers",
  "Secure payment handling",
];

const TRAINER_FEATURES = [
  "Create professional profile",
  "Accept unlimited clients",
  "Upload certification documents",
  "Build custom workout programs",
  "Create client diet plans",
  "Performance analytics",
  "15% platform commission only",
];

export default function Pricing() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "calc(100vh - 68px)" }}>
      <section className="pricing-section">
        <div className="container">
          <h1 className="pricing-title">SIMPLE PRICING</h1>
          <p className="pricing-sub">
            No complicated tiers. Pay for what you use.
          </p>

          <div className="grid-2" style={{ maxWidth: "800px", margin: "0 auto 60px" }}>
            {/* Client Plan */}
            <div className="pricing-card featured">
              <div className="pricing-plan">For Clients</div>
              <div className="pricing-price">
                <sup>$</sup>9.99
              </div>
              <div className="pricing-period">per month, platform access</div>
              <p className="pricing-desc">
                Everything you need to find the perfect trainer and track your fitness journey.
              </p>
              <ul className="pricing-features">
                {CLIENT_FEATURES.map(f => <li key={f}>{f}</li>)}
              </ul>
              <Link to="/register" className="btn btn-accent btn-full">Get Started Free</Link>
            </div>

            {/* Trainer Plan */}
            <div className="pricing-card">
              <div className="pricing-plan">For Trainers</div>
              <div className="pricing-price">
                <sup style={{ color: "var(--green)" }}>%</sup>15
              </div>
              <div className="pricing-period">commission per transaction</div>
              <p className="pricing-desc">
                No monthly fees. Only pay when you earn. Build your client base risk-free.
              </p>
              <ul className="pricing-features">
                {TRAINER_FEATURES.map(f => <li key={f}>{f}</li>)}
              </ul>
              <Link to="/register" className="btn btn-outline btn-full">Apply as Trainer</Link>
            </div>
          </div>

          {/* FAQ */}
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <h3 className="font-heading" style={{ fontSize: "32px", textAlign: "center", marginBottom: "28px" }}>
              COMMON QUESTIONS
            </h3>
            {[
              { q: "How does trainer verification work?", a: "Trainers upload their certification documents. Our admin team reviews and approves each application within 24–48 hours." },
              { q: "Can I switch trainers?", a: "Yes. Clients can browse trainers anytime and request a new coaching relationship whenever they choose." },
              { q: "Are payments secure?", a: "All payments are processed through Stripe with bank-level encryption. We never store card details." },
              { q: "Is there a free trial?", a: "New clients get their first month free to explore the platform and find their ideal trainer." },
            ].map(({ q, a }) => (
              <div key={q} style={{ borderBottom: "1px solid var(--border)", padding: "20px 0" }}>
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>{q}</div>
                <div style={{ color: "var(--text2)", fontSize: "14px" }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}