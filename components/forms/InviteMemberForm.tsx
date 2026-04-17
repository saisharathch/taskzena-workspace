"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  workspaceId: string;
  workspaceName: string;
  onSuccess?: () => void | Promise<void>;
};

export function InviteMemberForm({ workspaceId, workspaceName, onSuccess }: Props) {
  const router = useRouter();
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState("MEMBER");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage(`Invite sent to ${email.trim().toLowerCase()}`);
        setEmail("");
        router.refresh();
        await onSuccess?.();
      } else {
        setStatus("error");
        setMessage(data.error ?? "Failed to send invite.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack-sm">
      <h3 className="db-card-title">Invite to {workspaceName}</h3>
      <p className="subtitle">Send a 7-day invite link to a teammate's email address.</p>

      <div className="field">
        <label className="field-label">Email address</label>
        <input
          className="input"
          type="email"
          placeholder="teammate@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          required
          disabled={status === "loading"}
        />
      </div>

      <div className="field">
        <label className="field-label">Role</label>
        <select
          className="select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={status === "loading"}
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
          <option value="OWNER">Owner</option>
        </select>
      </div>

      {status === "success" && <div className="notice strong">{message}</div>}
      {status === "error"   && <div className="notice error">{message}</div>}

      <button className="button full" type="submit" disabled={status === "loading" || !email}>
        {status === "loading" ? "Sending…" : "Send invite"}
      </button>
    </form>
  );
}
