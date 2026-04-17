"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { InviteMemberForm } from "@/components/forms/InviteMemberForm";
import { MemberTable } from "@/app/dashboard/settings/[workspaceId]/MemberTable";

type WorkspaceOption = {
  id: string;
  name: string;
  role: string;
  canManage: boolean;
  memberCount: number;
};

type TeamMember = {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string;
  joinedAt: string;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
};

type TeamWorkspacePayload = {
  workspace: { id: string; name: string };
  currentUserId: string;
  callerRole: string;
  canManage: boolean;
  members: TeamMember[];
  invites: PendingInvite[];
};

type Props = {
  workspaces: WorkspaceOption[];
};

const inviteDateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function getAvatarLabel(member: TeamMember) {
  const label = member.fullName ?? member.email ?? "Unknown teammate";
  const parts = label.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function TeamManagementPanel({ workspaces }: Props) {
  const initialWorkspaceId = useMemo(
    () => workspaces.find((workspace) => workspace.canManage)?.id ?? workspaces[0]?.id ?? "",
    [workspaces],
  );
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(initialWorkspaceId);
  const [data, setData] = useState<TeamWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(Boolean(initialWorkspaceId));
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!initialWorkspaceId) return;
    setSelectedWorkspaceId((current) => current || initialWorkspaceId);
  }, [initialWorkspaceId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("invite") === "1") {
      setInviteOpen(true);
    }
  }, []);

  async function fetchWorkspaceMembers(workspaceId: string) {
    if (!workspaceId) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (!result.success) {
        setError(result.error ?? "We could not load teammates right now.");
        setData(null);
        return;
      }

      setData(result.data);
    } catch {
      setError("We had trouble loading this workspace. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    fetchWorkspaceMembers(selectedWorkspaceId);
  }, [selectedWorkspaceId]);

  const inviteAllowed = data?.canManage ?? workspaces.some((workspace) => workspace.canManage);
  const openInvite = () => {
    if (inviteAllowed) setInviteOpen(true);
  };

  if (!workspaces.length) {
    return (
      <section className="team-management-shell" id="team-management">
        <div className="team-empty-card">
          <span className="badge accent">Team setup</span>
          <h2 className="settings-card-title">Create or join a workspace to start collaborating</h2>
          <p className="settings-card-copy">
            Once you are in a workspace, you can invite teammates, review access, and manage who owns the work.
          </p>
          <div className="team-empty-actions">
            <Link className="button secondary" href="/dashboard/tasks">
              Go to Tasks
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="team-management-shell" id="team-management">
      <div className="team-management-toolbar">
        <div className="team-management-toolbar-copy">
          <p className="dash-section-kicker">Directory</p>
          <h2 className="dash-section-title">Manage members and permissions</h2>
          <p className="dash-section-copy">
            Keep teammates visible, follow invite progress, and make it clear who can help move work forward.
          </p>
        </div>

        <div className="team-management-toolbar-actions">
          <label className="field team-workspace-select">
            <span className="field-label">Workspace</span>
            <select
              className="select"
              value={selectedWorkspaceId}
              onChange={(event) => setSelectedWorkspaceId(event.target.value)}
              suppressHydrationWarning
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>

          {inviteAllowed ? (
            <button className="button" type="button" onClick={openInvite}>
              + Invite Teammate
            </button>
          ) : (
            <div className="team-readonly-note">
              You can review teammates here, but only owners and admins can send invites.
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="team-soft-error">
          <div>
            <strong className="team-soft-error-title">Team data is temporarily unavailable</strong>
            <p className="team-soft-error-copy">
              We could not refresh this workspace right now. Nothing is lost.
            </p>
          </div>
          <button
            className="button secondary"
            type="button"
            onClick={() => fetchWorkspaceMembers(selectedWorkspaceId)}
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="team-management-grid">
        <article className="team-summary-card team-summary-card--soft">
          <span className="team-summary-label">Current role</span>
          <strong className="team-summary-value">{data?.callerRole ?? "--"}</strong>
          <p className="team-summary-copy">
            {data?.canManage ? "You can invite, update, and remove teammates here." : "You currently have view access for this workspace."}
          </p>
        </article>
        <article className="team-summary-card team-summary-card--soft">
          <span className="team-summary-label">Members</span>
          <strong className="team-summary-value">{data?.members.length ?? 0}</strong>
          <p className="team-summary-copy">People currently collaborating in this workspace.</p>
        </article>
        <article className="team-summary-card team-summary-card--soft">
          <span className="team-summary-label">Pending invites</span>
          <strong className="team-summary-value">{data?.invites.length ?? 0}</strong>
          <p className="team-summary-copy">Invites waiting to be accepted and turned into active collaborators.</p>
        </article>
      </div>

      <div className="team-management-panels">
        <section className="settings-card">
          <div className="team-panel-header">
            <div>
              <span className="badge accent">Members</span>
              <h3 className="settings-card-title team-panel-title">
                {data?.workspace.name ?? "Workspace members"}
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="team-empty-card team-empty-card--compact">
              <h4 className="team-empty-title">Loading teammate details</h4>
              <p className="team-empty-copy">Bringing the latest member list and invite status into view.</p>
            </div>
          ) : data?.members.length ? (
            <div className="team-members-stack">
              <div className="team-member-spotlight">
                {data.members.slice(0, 4).map((member) => (
                  <article key={member.id} className="team-member-chip">
                    <div className="team-member-avatar" aria-hidden="true">
                      {getAvatarLabel(member)}
                    </div>
                    <div className="team-member-copy">
                      <strong>{member.fullName ?? member.email ?? "Unknown teammate"}</strong>
                      <span>{member.role}</span>
                    </div>
                  </article>
                ))}
              </div>

              <MemberTable
                members={data.members}
                workspaceId={data.workspace.id}
                currentUserId={data.currentUserId}
                canManage={data.canManage}
                onChanged={() => fetchWorkspaceMembers(data.workspace.id)}
              />
            </div>
          ) : data ? (
            <div className="team-empty-card">
              <span className="badge accent">No teammates yet</span>
              <h4 className="team-empty-title">Start building your collaboration circle</h4>
              <p className="team-empty-copy">
                Invite one or two teammates first so task ownership, workload, and permissions become visible here.
              </p>
              <div className="team-empty-actions">
                {data.canManage ? (
                  <button className="button" type="button" onClick={openInvite}>
                    Invite Teammate
                  </button>
                ) : null}
                <Link className="button secondary" href="/dashboard/tasks">
                  Go to Tasks
                </Link>
              </div>
            </div>
          ) : (
            <div className="team-empty-card team-empty-card--compact">
              <h4 className="team-empty-title">Choose a workspace to see the team</h4>
              <p className="team-empty-copy">Switch workspaces above to review members, access, and collaboration status.</p>
            </div>
          )}
        </section>

        <aside className="settings-card">
          <div className="team-panel-header">
            <div>
              <span className="badge">Pending</span>
              <h3 className="settings-card-title team-panel-title">Outstanding invites</h3>
            </div>
            {data?.canManage ? (
              <button className="button secondary" type="button" onClick={openInvite}>
                Invite
              </button>
            ) : null}
          </div>

          {!data?.invites.length ? (
            <div className="team-empty-card team-empty-card--compact">
              <h4 className="team-empty-title">No pending invites right now</h4>
              <p className="team-empty-copy">
                Invite teammates to bring more people into the workspace and start sharing ownership.
              </p>
              <div className="team-empty-actions">
                {data?.canManage ? (
                  <button className="button" type="button" onClick={openInvite}>
                    Invite Teammate
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="team-invite-stack">
              <div className="team-invite-summary">
                <p className="team-invite-summary-copy">
                  {data.invites.length} invite{data.invites.length !== 1 ? "s are" : " is"} still waiting on a response.
                </p>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Sent</th>
                      <th>Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invites.map((invite) => (
                      <tr key={invite.id}>
                        <td>
                          <strong>{invite.email}</strong>
                        </td>
                        <td>
                          <span className="pill">{invite.role}</span>
                        </td>
                        <td className="table-subtitle">{inviteDateFmt.format(new Date(invite.createdAt))}</td>
                        <td className="table-subtitle">{inviteDateFmt.format(new Date(invite.expiresAt))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </aside>
      </div>

      {inviteOpen && data?.canManage && data ? (
        <div className="team-modal-backdrop" role="presentation" onClick={() => setInviteOpen(false)}>
          <div
            className="team-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-invite-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="team-modal-header">
              <div>
                <span className="badge accent">Invite</span>
                <h3 className="settings-card-title team-panel-title" id="team-invite-title">
                  Invite teammate to {data.workspace.name}
                </h3>
              </div>
              <button className="button secondary" type="button" onClick={() => setInviteOpen(false)}>
                Close
              </button>
            </div>

            <InviteMemberForm
              workspaceId={data.workspace.id}
              workspaceName={data.workspace.name}
              onSuccess={async () => {
                setInviteOpen(false);
                await fetchWorkspaceMembers(data.workspace.id);
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
