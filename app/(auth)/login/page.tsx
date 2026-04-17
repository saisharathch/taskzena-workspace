import Link from "next/link";
import { AuthForm } from "@/components/shared/AuthForm";
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
    title: "Workspace visibility",
    desc: "See what's moving, blocked, or at risk — at a glance.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "AI-assisted triage",
    desc: "Smart summaries and next-step suggestions, instantly.",
  },
];

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <div className="auth-grid">

        <section className="auth-showcase">
          <BrandMark href="/" inverted />

          <div className="auth-showcase-body">
            <div className="auth-showcase-text">
              <h1 className="auth-showcase-title">Welcome back.</h1>
              <p className="auth-showcase-lead">
                Your workspace, projects, and AI workflows are ready.
              </p>
            </div>

            <div className="auth-stat-grid">
              {features.map((f) => (
                <article key={f.title} className="auth-stat">
                  <div className="auth-stat-icon">{f.icon}</div>
                  <strong className="auth-stat-title">{f.title}</strong>
                  <p className="auth-stat-desc">{f.desc}</p>
                </article>
              ))}
            </div>

            <p className="auth-showcase-footnote">
              Role-aware access · Activity tracking · Mobile ready
            </p>
          </div>
        </section>

        <section className="card auth-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Sign in to Taskzena</h2>
            <p className="auth-form-sub">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-link">Create one</Link>
            </p>
          </div>

          <AuthForm mode="login" />
        </section>

      </div>
    </main>
  );
}
