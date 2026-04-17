"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/shared/BrandMark";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/auth/callback?next=/reset-password`
        : "/api/auth/callback?next=/reset-password";

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="auth-shell">
      <div className="auth-center-wrap">
        <section className="card auth-card-narrow stack-lg">
          {/* Brand */}
          <BrandMark href="/" />

          {sent ? (
            /* ── Success state ── */
            <div className="stack">
              <div className="notice strong stack-sm">
                <p className="section-title">Check your inbox</p>
                <p className="subtitle">
                  We sent a password-reset link to <strong>{email}</strong>.
                  Click the link in the email to choose a new password.
                </p>
                <p className="subtitle">
                  Didn&apos;t receive it? Check your spam folder or{" "}
                  <button
                    className="text-link"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    onClick={() => { setSent(false); setError(null); }}
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
              <Link href="/login" className="button secondary full" style={{ textAlign: "center" }}>
                ← Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="stack-sm">
                <span className="badge accent">Password reset</span>
                <h2 className="section-title">Forgot your password?</h2>
                <p className="subtitle">
                  Enter the email address linked to your account and we&apos;ll
                  send you a reset link.
                </p>
              </div>

              <form className="stack" onSubmit={handleSubmit}>
                <label className="field">
                  <span className="field-label">Email address</span>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="team@company.com"
                    autoComplete="email"
                    required
                  />
                </label>

                {error && (
                  <div className="notice error">
                    <p className="error">{error}</p>
                  </div>
                )}

                <button className="button full" type="submit" disabled={loading || !email}>
                  {loading ? "Sending link…" : "Send reset link"}
                </button>
              </form>

              <p className="helper-text" style={{ textAlign: "center" }}>
                Remembered it?{" "}
                <Link href="/login" className="text-link">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
