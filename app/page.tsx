import Link from "next/link";
import { BrandMark } from "@/components/shared/BrandMark";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    title: "Project tracking",
    description: "Organize work into projects. See what's on track, at risk, or blocked — at a glance.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    title: "Task management",
    description: "Create, assign, and prioritize tasks. Set due dates and keep your whole team aligned.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "AI insights",
    description: "Surface overdue tasks, workload imbalances, and delivery risks before they become problems.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Team collaboration",
    description: "Invite teammates, manage roles, and track activity across your workspace in real time.",
  },
];

function DashboardMockup() {
  return (
    <div className="lp-mockup" aria-hidden="true">
      <div className="lp-mockup-chrome">
        <span className="lp-mockup-dot lp-mockup-dot--red" />
        <span className="lp-mockup-dot lp-mockup-dot--yellow" />
        <span className="lp-mockup-dot lp-mockup-dot--green" />
        <span className="lp-mockup-chrome-label">Taskzena — Q2 Sprint</span>
      </div>
      <div className="lp-mockup-body">
        <div className="lp-mockup-kpis">
          <div className="lp-mockup-kpi">
            <span className="lp-mockup-kpi-label">Tasks Done</span>
            <span className="lp-mockup-kpi-value">24</span>
            <span className="lp-mockup-kpi-trend lp-mockup-kpi-trend--up">↑ 12%</span>
          </div>
          <div className="lp-mockup-kpi">
            <span className="lp-mockup-kpi-label">In Progress</span>
            <span className="lp-mockup-kpi-value">8</span>
            <span className="lp-mockup-kpi-trend">→ stable</span>
          </div>
          <div className="lp-mockup-kpi">
            <span className="lp-mockup-kpi-label">At Risk</span>
            <span className="lp-mockup-kpi-value">2</span>
            <span className="lp-mockup-kpi-trend lp-mockup-kpi-trend--down">↓ 1</span>
          </div>
        </div>

        <div className="lp-mockup-ai-block">
          <span className="lp-mockup-ai-chip">✦ AI Insight</span>
          <p className="lp-mockup-ai-text">
            3 tasks overdue in &ldquo;Design System&rdquo;. Consider reassigning to balance workload.
          </p>
        </div>

        <div className="lp-mockup-tasks">
          {[
            { label: "Finalize onboarding flow", initials: "AS", done: true },
            { label: "API rate limiting research", initials: "JM", done: false },
            { label: "Update component library", initials: "KP", done: false },
          ].map((task) => (
            <div key={task.label} className={`lp-mockup-task${task.done ? " lp-mockup-task--done" : ""}`}>
              <span className={`lp-mockup-check${task.done ? " lp-mockup-check--done" : ""}`} />
              <span className="lp-mockup-task-label">{task.label}</span>
              <span className="lp-mockup-avatar">{task.initials}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="lp-shell">

      {/* ── Nav ─────────────────────────────────────── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <BrandMark />
          <nav className="lp-nav-links" aria-label="Site navigation">
            <a href="#features" className="lp-nav-link">Features</a>
          </nav>
          <div className="lp-nav-actions">
            <Link href="/login" className="lp-btn-ghost">Sign in</Link>
            <Link href="/signup" className="lp-btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-left">
            <span className="lp-hero-badge">✦ AI-powered task platform</span>
            <h1 className="lp-title">
              The smarter way<br />
              to run your team.
            </h1>
            <p className="lp-lead">
              Taskzena brings projects, tasks, and teammates into one clean workspace.
              AI surfaces what needs attention before things go off track.
            </p>
            <div className="lp-cta">
              <Link href="/signup" className="lp-btn-primary lp-btn--lg">
                Create free workspace
              </Link>
              <Link href="/login" className="lp-btn-outline lp-btn--lg">
                Sign in
              </Link>
            </div>
            <p className="lp-trust">Used by modern teams to stay aligned.</p>
          </div>

          <div className="lp-hero-right">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section className="lp-features" id="features">
        <div className="lp-features-inner">
          <div className="lp-section-header">
            <span className="lp-eyebrow">Platform</span>
            <h2 className="lp-section-title">Everything your team needs</h2>
            <p className="lp-section-lead">
              One workspace for projects, tasks, and AI-driven delivery insights.
            </p>
          </div>

          <div className="lp-features-grid">
            {features.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-cta-section-inner">
          <span className="lp-cta-eyebrow">Start today — it&apos;s free</span>
          <h2 className="lp-cta-title">
            Ship faster.<br />Stay aligned.
          </h2>
          <p className="lp-cta-lead">
            Join teams that use Taskzena to deliver projects with clarity and confidence.
          </p>
          <Link href="/signup" className="lp-btn-white lp-btn--lg">
            Create free workspace →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <BrandMark href={null} />
          <p className="lp-footer-copy">© 2025 Taskzena. Built for modern teams.</p>
        </div>
      </footer>

    </main>
  );
}
