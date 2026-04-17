import Link from "next/link";
import { AuthForm } from "@/components/shared/AuthForm";
import { BrandMark } from "@/components/shared/BrandMark";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    title: "Structured workspaces",
    desc: "Invite teammates into real projects, not just task lists.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "AI-powered execution",
    desc: "Generate summaries and subtasks directly from the dashboard.",
  },
];

export default function SignupPage() {
  return (
    <main className="auth-shell">
      <div className="auth-grid">

        <section className="auth-showcase">
          <BrandMark href="/" inverted />

          <div className="auth-showcase-body">
            <div className="auth-showcase-text">
              <h1 className="auth-showcase-title">Build something real.</h1>
              <p className="auth-showcase-lead">
                Taskzena gives your team structured workspaces, full task visibility, and AI-driven delivery.
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
              Free to start · No credit card required · Production-ready
            </p>
          </div>
        </section>

        <section className="card auth-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-sub">
              Already have an account?{" "}
              <Link href="/login" className="text-link">Sign in</Link>
            </p>
          </div>

          <AuthForm mode="signup" />
        </section>

      </div>
    </main>
  );
}
