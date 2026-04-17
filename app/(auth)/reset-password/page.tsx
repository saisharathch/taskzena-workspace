"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/shared/BrandMark";

export default function ResetPasswordPage() {
  const supabase  = createClient();
  const router    = useRouter();

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      // Session may have expired — the reset link is single-use
      if (
        updateError.message.toLowerCase().includes("session") ||
        updateError.message.toLowerCase().includes("expired") ||
        updateError.message.toLowerCase().includes("jwt")
      ) {
        setError("This reset link has expired or already been used. Please request a new one.");
      } else {
        setError(updateError.message);
      }
      return;
    }

    setSuccess(true);
    // Redirect to dashboard after a short delay
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <main className="auth-shell">
      <div className="auth-center-wrap">
        <section className="card auth-card-narrow stack-lg">
          <BrandMark href="/" />

          {success ? (
            /* ── Success ── */
            <div className="stack">
              <div className="notice strong stack-sm">
                <p className="section-title">Password updated!</p>
                <p className="subtitle">
                  Your password has been changed successfully. Redirecting you to the dashboard…
                </p>
              </div>
              <Link href="/dashboard" className="button full" style={{ textAlign: "center" }}>
                Go to dashboard
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div className="stack-sm">
                <span className="badge accent">New password</span>
                <h2 className="section-title">Reset your password</h2>
                <p className="subtitle">Choose a strong password you haven&apos;t used before.</p>
              </div>

              <form className="stack" onSubmit={handleSubmit}>
                <label className="field">
                  <span className="field-label">New password</span>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <p className="field-note">Minimum 8 characters.</p>
                </label>

                <label className="field">
                  <span className="field-label">Confirm new password</span>
                  <input
                    className="input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>

                {error && (
                  <div className="notice error stack-sm">
                    <p className="error">{error}</p>
                    {error.includes("expired") && (
                      <p className="subtitle">
                        <Link href="/forgot-password" className="text-link">
                          Request a new reset link →
                        </Link>
                      </p>
                    )}
                  </div>
                )}

                <button
                  className="button full"
                  type="submit"
                  disabled={loading || !password || !confirm}
                >
                  {loading ? "Updating password…" : "Set new password"}
                </button>
              </form>

              <p className="helper-text" style={{ textAlign: "center" }}>
                Changed your mind?{" "}
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
