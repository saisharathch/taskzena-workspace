"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string;
  joinedAt: Date | string;
};

type Props = {
  members: Member[];
  workspaceId: string;
  currentUserId: string;
  callerRole: string;
  canManage: boolean;
  canTransferOwnership: boolean;
  onChanged?: () => void | Promise<void>;
};

const ROLES = ["MEMBER", "ADMIN", "OWNER"] as const;
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function MemberTable({ members, workspaceId, currentUserId, callerRole, canManage, canTransferOwnership, onChanged }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateRole(memberId: string, role: string) {
    setLoading(memberId);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!data.success) setError(data.error ?? "Failed to update role.");
      else if (onChanged) await onChanged();
      else router.refresh();
    } catch { setError("Network error."); }
    finally { setLoading(null); }
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member from the workspace?")) return;
    setLoading(memberId);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) setError(data.error ?? "Failed to remove member.");
      else if (onChanged) await onChanged();
      else router.refresh();
    } catch { setError("Network error."); }
    finally { setLoading(null); }
  }

  return (
    <div className="stack-sm">
      {error && <div className="notice error">{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Member</th><th>Role</th><th>Joined</th>{canManage && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const isSelf = m.userId === currentUserId;
              const isLoading = loading === m.id;
              const canManageThisMember = canManage && !isSelf && (callerRole === "OWNER" || m.role !== "OWNER");
              const roleOptions = canTransferOwnership ? ROLES : ROLES.filter((role) => role !== "OWNER");
              return (
                <tr key={m.id}>
                  <td>
                    <strong>{m.fullName ?? m.email}</strong>
                    {m.fullName && <div className="table-subtitle">{m.email}</div>}
                    {isSelf && <span className="db-overdue-tag" style={{ background: "var(--accent)" }}>You</span>}
                  </td>
                  <td>
                    {canManageThisMember ? (
                      <select
                        className="select"
                        style={{ minHeight: "unset", padding: "0.3rem 2rem 0.3rem 0.6rem", fontSize: "0.85rem" }}
                        value={m.role}
                        onChange={(e) => updateRole(m.id, e.target.value)}
                        disabled={isLoading}
                      >
                        {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className="pill">{m.role}</span>
                    )}
                  </td>
                  <td className="table-subtitle">{dateFmt.format(new Date(m.joinedAt))}</td>
                  {canManage && (
                    <td>
                      {canManageThisMember && (
                        <button
                          className="button secondary"
                          style={{ minHeight: "unset", padding: "0.35rem 0.8rem", fontSize: "0.82rem" }}
                          onClick={() => removeMember(m.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? "…" : "Remove"}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
