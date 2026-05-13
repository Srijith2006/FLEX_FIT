import { useState, useEffect, useRef } from "react";
import "./Home.css";

// If you place footer-preview.png in the same folder as Home.jsx:
// import footerImg from "./footer-preview.png";
// Otherwise adjust the path. We use a relative string here as fallback:
const FOOTER_IMG = new URL("./footer-preview.png", import.meta.url).href;

// ── useInView ─────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links = [
    { label: "Features",    href: "#features"     },
    { label: "How It Works",href: "#how-it-works"  },
    { label: "Roles",       href: "#roles"         },
    { label: "FAQ",         href: "#faq"           },
  ];
  return (
    <nav className={`nav ${scrolled ? "nav--solid" : ""}`}>
      <div className="nav__inner">
        <a href="/" className="nav__logo">
          <span className="logo-bolt">⚡</span>FLEX<span className="logo-blue">FIT</span>
        </a>
        <ul className="nav__links">
          {links.map(l => (
            <li key={l.label}><a href={l.href} className="nav__link">{l.label}</a></li>
          ))}
        </ul>
        <div className="nav__actions">
          <a href="/login"    className="nav__signin">Sign In</a>
          <a href="/register" className="btn btn--primary btn--sm">Join Free →</a>
        </div>
        <button
          className={`hamburger ${menuOpen ? "hamburger--open" : ""}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
      <div className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}>
        {links.map(l => (
          <a key={l.label} href={l.href} className="mobile-link"
            onClick={() => setMenuOpen(false)}>{l.label}</a>
        ))}
        <div className="mobile-menu__ctas">
          <a href="/login"    className="btn btn--ghost btn--full">Sign In</a>
          <a href="/register" className="btn btn--primary btn--full">Get Started Free</a>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero">
      <div className="hero__grid" aria-hidden />
      <div className="orb orb--a" aria-hidden />
      <div className="orb orb--b" aria-hidden />
      <div className="hero__inner">
        <div className="hero__badge">
          <span className="hero__dot" />
          Now Live — Join the FlexFit community today
        </div>
        <h1 className="hero__h1">
          Train Smarter.<br />
          <span className="grad">Track Everything.</span><br />
          Grow Together.
        </h1>
        <p className="hero__sub">
          FlexFit is a complete fitness platform — connecting clients with professional trainers,
          offering real-time session tracking, video proof, diet planning, live sessions,
          and a built-in marketplace. Everything your fitness journey needs, in one place.
        </p>
        <div className="hero__ctas">
          <a href="/register" className="btn btn--primary btn--lg">Get Started — It's Free →</a>
          <a href="#features"  className="btn btn--ghost btn--lg">Explore Features</a>
        </div>
        <p className="hero__fine">No credit card required · Free to join · Open to all fitness levels</p>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon:"🏋️", accent:"#0070f3", title:"Program Enrollment",
    desc:"Clients browse and enroll in structured fitness programs. Each includes a weekly workout schedule, diet plan, and progress tracking." },
  { icon:"⏱",  accent:"#10b981", title:"Session Timer & Video Proof",
    desc:"Start the built-in countdown timer, complete your workout, stop it, then upload a short video — automatically sent to your trainer for review." },
  { icon:"🛒",  accent:"#8b5cf6", title:"Built-In Marketplace",
    desc:"An in-platform marketplace where trainers list programs and clients discover, compare, and purchase them — no external tools needed." },
  { icon:"🥗",  accent:"#f59e0b", title:"Diet Plan & Meal Logging",
    desc:"Trainers assign detailed meal plans. Clients log meals and upload food photos as proof, keeping nutrition accountable." },
  { icon:"💬",  accent:"#0070f3", title:"Real-Time Messaging",
    desc:"Direct and group messaging between clients and trainers — built into the platform. No WhatsApp, no email. One place for everything." },
  { icon:"📊",  accent:"#10b981", title:"Progress Dashboard",
    desc:"Clients see a complete timeline of sessions, duration logs, video submissions, and streaks. Trainers see a proof feed for all clients." },
  { icon:"🎥",  accent:"#8b5cf6", title:"Live Group Sessions",
    desc:"Trainers schedule live video sessions for one-on-one or group training. Clients get notified and join via a meeting link inside FlexFit." },
  { icon:"🏪",  accent:"#f59e0b", title:"Vendor Store",
    desc:"Verified vendors list fitness products — supplements, gear, apparel — inside FlexFit. Clients shop without leaving the platform." },
];

function Features() {
  const [ref, visible] = useInView(0.05);
  return (
    <section className="section" id="features" ref={ref}>
      <div className="container">
        <div className={`section-hd reveal ${visible ? "reveal--in" : ""}`}>
          <div className="section-tag">What's Inside</div>
          <h2 className="section-title">Everything in <span className="grad">One Platform</span></h2>
          <p className="section-sub">
            FlexFit is more than a workout tracker — it's a complete fitness ecosystem built
            for clients, trainers, and vendors to collaborate, track, and grow.
          </p>
        </div>
        <div className="feat-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`feat-card reveal ${visible ? "reveal--in" : ""}`}
              style={{ transitionDelay: `${i * 55}ms`, "--accent": f.accent }}
            >
              <div className="feat-card__icon">{f.icon}</div>
              <h3 className="feat-card__title">{f.title}</h3>
              <p className="feat-card__desc">{f.desc}</p>
              <div className="feat-card__bar" style={{ background: f.accent }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
const STEPS = [
  { num:"01", icon:"👤", title:"Create Your Account",
    desc:"Sign up as a Client, Trainer, or Vendor. Set up your profile in under 2 minutes — no credit card needed." },
  { num:"02", icon:"🔍", title:"Discover Programs",
    desc:"Browse the built-in marketplace. Filter by goal, duration, category, or trainer. Trainers publish their plans instantly." },
  { num:"03", icon:"📋", title:"Enroll & Get a Plan",
    desc:"Once enrolled, your trainer assigns your daily workouts and a personalised diet plan tailored to your goals." },
  { num:"04", icon:"⏱",  title:"Track Every Session",
    desc:"Use the built-in timer during your workout. When done, upload a short video as proof — your trainer sees it immediately." },
  { num:"05", icon:"📈", title:"Progress & Improve",
    desc:"Your trainer reviews your submissions, gives feedback, and adjusts your plan. Watch your progress compound over time." },
];

function HowItWorks() {
  const [ref, visible] = useInView(0.08);
  return (
    <section className="section hiw" id="how-it-works" ref={ref}>
      <div className="container">
        <div className={`section-hd reveal ${visible ? "reveal--in" : ""}`}>
          <div className="section-tag">The Journey</div>
          <h2 className="section-title">How <span className="grad">FlexFit</span> Works</h2>
          <p className="section-sub">Five simple steps from sign-up to real, measurable results.</p>
        </div>
        <div className="hiw__steps">
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`hiw__step reveal ${visible ? "reveal--in" : ""}`}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <div className="hiw__num">{s.num}</div>
              <div className="hiw__body">
                <div className="hiw__icon">{s.icon}</div>
                <div>
                  <h4 className="hiw__title">{s.title}</h4>
                  <p className="hiw__desc">{s.desc}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && <div className="hiw__line" aria-hidden />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES = [
  {
    icon:"🧍", accent:"#0070f3", title:"Client", tag:"I want to train",
    perks:["Enroll in trainer programs","Get daily workout + diet plans","Track sessions with timer","Upload video proof","Message your trainer","Join live group sessions"],
  },
  {
    icon:"🏅", accent:"#10b981", title:"Trainer", tag:"I want to coach",
    perks:["List programs in marketplace","Assign workouts & meal plans","Review client video proof","Schedule live sessions","Proof feed for all clients","Direct & group messaging"],
  },
  {
    icon:"🏪", accent:"#8b5cf6", title:"Vendor", tag:"I want to sell",
    perks:["List fitness products on FlexFit","Reach an active community","Manage your product catalog","Dedicated vendor dashboard","No external store needed","Direct platform integration"],
  },
];

function Roles() {
  const [ref, visible] = useInView(0.1);
  return (
    <section className="section roles" id="roles" ref={ref}>
      <div className="container">
        <div className={`section-hd reveal ${visible ? "reveal--in" : ""}`}>
          <div className="section-tag">Who Is This For?</div>
          <h2 className="section-title">Three Roles. <span className="grad">One Platform.</span></h2>
          <p className="section-sub">Whether you're training, coaching, or selling — FlexFit is built for you.</p>
        </div>
        <div className="roles-grid">
          {ROLES.map((r, i) => (
            <div
              key={r.title}
              className={`role-card reveal ${visible ? "reveal--in" : ""}`}
              style={{ transitionDelay: `${i * 110}ms`, "--accent": r.accent }}
            >
              <div className="role-card__head">
                <div className="role-card__icon">{r.icon}</div>
                <span className="role-card__tag" style={{ color: r.accent, background: r.accent + "1a" }}>
                  {r.tag}
                </span>
              </div>
              <h3 className="role-card__title">{r.title}</h3>
              <ul className="role-card__perks">
                {r.perks.map(p => (
                  <li key={p}><span style={{ color: r.accent }}>✓</span> {p}</li>
                ))}
              </ul>
              <a href="/register" className="btn btn--ghost btn--sm btn--full role-card__cta">
                Join as {r.title} →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  { q:"Is FlexFit free to join?",
    a:"Yes — signing up as a client, trainer, or vendor is completely free. Clients pay for individual programs they choose in the marketplace." },
  { q:"How do trainers get paid?",
    a:"Trainers set their own program prices. When a client purchases, payment is processed through the platform and credited to the trainer's account." },
  { q:"What is the Session Tracker?",
    a:"It's a built-in timer clients use during workouts. When done, they stop it and optionally upload a short workout video — the trainer sees the duration and video in their proof feed." },
  { q:"Can I message my trainer directly?",
    a:"Yes. Every enrollment comes with direct messaging between the client and trainer. Trainers can also create group chats for all enrolled clients." },
  { q:"Do I need any other apps or tools?",
    a:"No. FlexFit handles programs, messaging, session tracking, diet plans, live sessions, vendor products, and the marketplace — all in one place." },
  { q:"How does the marketplace work?",
    a:"The marketplace is built directly into FlexFit. Trainers create and list programs with pricing; clients browse, compare, and enroll — no third-party tools involved." },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  const [ref, visible] = useInView(0.08);
  return (
    <section className="section faq" id="faq" ref={ref}>
      <div className="container container--narrow">
        <div className={`section-hd reveal ${visible ? "reveal--in" : ""}`}>
          <div className="section-tag">FAQ</div>
          <h2 className="section-title">Common <span className="grad">Questions</span></h2>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div
              key={i}
              className={`faq-item reveal ${visible ? "reveal--in" : ""} ${open === i ? "faq-item--open" : ""}`}
              style={{ transitionDelay: `${i * 55}ms` }}
            >
              <button className="faq-item__q" onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.q}</span>
                <span className="faq-item__icon">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p className="faq-item__a">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Strip ─────────────────────────────────────────────────────────────────
function CTAStrip() {
  const [ref, visible] = useInView(0.2);
  return (
    <section className="cta-strip" ref={ref}>
      <div className="orb orb--cta" aria-hidden />
      <div className={`cta-strip__inner reveal ${visible ? "reveal--in" : ""}`}>
        <h2 className="cta-strip__h">Ready to Start Your Journey?</h2>
        <p className="cta-strip__sub">
          Join FlexFit today — free to sign up, no commitment, start training with a real trainer in minutes.
        </p>
        <a href="/register" className="btn btn--primary btn--lg">Create Your Free Account →</a>
        <p className="cta-strip__note">✓ Free to join &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Cancel anytime</p>
      </div>
    </section>
  );
}

// ── Footer Image ──────────────────────────────────────────────────────────────
function FooterPreview() {
  return (
    <div className="footer-preview">
      <img
        src={FOOTER_IMG}
        alt="FlexFit footer"
        className="footer-preview__img"
        onError={e => { e.target.style.display = "none"; }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="page">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Roles />
      <FAQ />
      <CTAStrip />
      <FooterPreview />
    </div>
  );
}