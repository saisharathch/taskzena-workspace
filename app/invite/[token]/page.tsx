"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BrandMark } from "@/components/shared/BrandMark";

type InviteDetails = {
  email: string;
  role: string;
  workspace: { id: string; name: string };
  invitedBy: { fullName: string | null; email: string | null };
};

type State =
  | { phase: "loading" }
  | { phase: "ready"; invite: InviteDetails }
  | { phase: "accepting" }
  | { phase: "accepted"; workspaceId: string }
  | { phase: "error"; message: string };

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setState({ phase: "ready", invite: res.data });
        else setState({ phase: "error", message: res.error ?? "Invalid invite." });
      })
      .catch(() => setState({ phase: "error", message: "Failed to load invite." }));
  }, [token]);

  async function handleAccept() {
    setState((s) => s.phase === "ready" ? { phase: "accepting" } : s);
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setState({ phase: "accepted", workspaceId: data.data.workspaceId });
        setTimeout(() => router.push("/dashboard"), 1800);
      } else {
        setState({ phase: "error", message: data.error ?? "Failed to accept." });
      }
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <div className="invite-shell">
      <div className="invite-card">
        <div className="invite-brand">
          <BrandMark href="/" />
        </div>

        {state.phase === "loading" && (
          <div className="invite-body">
            <div className="db-ai-spinner" style={{ margin: "0 auto" }} />
            <p className="helper-text" style={{ textAlign: "center" }}>Loading invite…</p>
          </div>
        )}

        {state.phase === "ready" && (
          <div className="invite-body stack">
            <div className="stack-sm">
              <p className="overline">Workspace invitation</p>
              <h1 className="invite-title">Join {state.invite.workspace.name}</h1>
              <p className="lead">
                {state.invite.invitedBy.fullName ?? state.invite.invitedBy.email} invited{" "}
                <strong>{state.invite.email}</strong> as a{" "}
                <strong>{state.invite.role.toLowerCase()}</strong>.
              </p>
            </div>
            <button className="button full" onClick={handleAccept}>
              Accept invitation
            </button>
            <button className="button secondary full" onClick={() => router.push("/")}>
              Decline
            </button>
          </div>
        )}

        {state.phase === "accepting" && (
          <div className="invite-body" style={{ textAlign: "center" }}>
            <div className="db-ai-spinner" style={{ margin: "0 auto 1rem" }} />
            <p className="helper-text">Joining workspace…</p>
          </div>
        )}

        {state.phase === "accepted" && (
          <div className="invite-body stack-sm" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "2.5rem" }}>✓</p>
            <h2 className="section-title">You're in!</h2>
            <p className="helper-text">Redirecting to your dashboard…</p>
          </div>
        )}

        {state.phase === "error" && (
          <div className="invite-body stack">
            <div className="notice error">
              <strong>Invite unavailable</strong>
              <p>{state.message}</p>
            </div>
            <button className="button secondary full" onClick={() => router.push("/")}>
              Back to home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
