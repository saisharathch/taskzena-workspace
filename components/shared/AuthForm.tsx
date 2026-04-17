"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  function friendlyError(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes("email rate limit") || msg.includes("rate limit")) {
      return "Email rate limit reached. If you already have an account, try signing in. Otherwise wait a few minutes or disable email confirmations in your Supabase dashboard under Authentication -> Settings for local development.";
    }
    if (msg.includes("user already registered") || msg.includes("already been registered")) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
      return "Incorrect email or password.";
    }
    if (msg.includes("email not confirmed")) {
      return "Please confirm your email address before signing in.";
    }
    return message;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            data: { full_name: fullName }
          }
        });

        if (signUpError) {
          const msg = signUpError.message.toLowerCase();
          if (msg.includes("email rate limit") || msg.includes("rate limit")) {
            // Account may already exist, so try signing in silently before giving up.
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (!signInError) {
              router.push("/dashboard");
              router.refresh();
              return;
            }
          }
          throw signUpError;
        }

        if (data.session) {
          router.push("/dashboard");
          router.refresh();
          return;
        }

        setCheckEmail(true);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw signInError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Authentication failed."));
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="stack">
        <div className="notice strong stack-sm">
          <p className="section-title">Check your email</p>
          <p className="subtitle">
            We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account.
          </p>
          <p className="subtitle">
            For local development, you can disable email confirmations in Supabase under <strong>Authentication -&gt; Settings</strong>.
          </p>
        </div>
        <Link href="/login" className="text-link">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {mode === "signup" ? (
        <label className="field">
          <span className="field-label">Full name</span>
          <input
            className="input"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Jordan Lee"
            autoComplete="name"
            required
            suppressHydrationWarning
          />
        </label>
      ) : null}

      <label className="field">
        <span className="field-label">Email</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="team@company.com"
          autoComplete="email"
          required
          suppressHydrationWarning
        />
      </label>

      <label className="field">
        <div className="field-label-row">
          <span className="field-label">Password</span>
          {mode === "login" && (
            <Link href="/forgot-password" className="text-link" style={{ fontSize: "0.82rem" }}>
              Forgot password?
            </Link>
          )}
        </div>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={mode === "signup" ? "Create a secure password" : "Enter your password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={8}
          required
          suppressHydrationWarning
        />
        {mode === "signup" ? <p className="field-note">Use at least 8 characters for local auth testing.</p> : null}
      </label>

      {error ? (
        <div className="notice error stack-sm">
          <p className="error">{error}</p>
          {mode === "signup" && error.includes("rate limit") ? (
            <p className="subtitle">
              Already registered?{" "}
              <Link href="/login" className="text-link">
                Sign in instead
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : null}

      <button className="auth-submit-btn" type="submit" disabled={loading} suppressHydrationWarning>
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>

      <p className="auth-trust-signal">
        🔒 Secure login · Trusted by modern teams
      </p>
    </form>
  );
}
