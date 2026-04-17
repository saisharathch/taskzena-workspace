import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { MemberTable } from "./MemberTable";
import { InviteMemberForm } from "@/components/forms/InviteMemberForm";
import Link from "next/link";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const user = await requireAppUser();
  const { workspaceId } = await params;

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  });
  if (!membership) redirect("/dashboard");

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      memberships: {
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      invites: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!workspace) redirect("/dashboard");

  const canManage = ["OWNER", "ADMIN"].includes(membership.role);

  return (
    <main className="db-shell">
      <div className="container db-body">
        <div className="db-section-header" style={{ marginBottom: "0.5rem" }}>
          <div>
            <Link href="/dashboard" className="text-link" style={{ fontSize: "0.9rem" }}>
              ← Back to dashboard
            </Link>
            <h1 className="section-title" style={{ marginTop: "0.5rem" }}>
              {workspace.name} — Settings
            </h1>
            <p className="subtitle">Manage members, roles, and pending invites.</p>
          </div>
          <span className={`pill ${membership.role === "OWNER" ? "priority-urgent" : membership.role === "ADMIN" ? "priority-high" : "priority-low"}`}>
            Your role: {membership.role}
          </span>
        </div>

        <div className="db-main-grid">
          <div className="stack-xl">
            {/* Members table */}
            <section className="db-section">
              <div className="db-section-header">
                <div>
                  <span className="badge">Members</span>
                  <h2 className="section-title" style={{ marginTop: "0.35rem" }}>
                    {workspace.memberships.length} member{workspace.memberships.length !== 1 ? "s" : ""}
                  </h2>
                </div>
              </div>
              <MemberTable
                members={workspace.memberships.map((m) => ({
                  id: m.id,
                  userId: m.user.id,
                  fullName: m.user.fullName,
                  email: m.user.email,
                  role: m.role,
                  joinedAt: m.createdAt,
                }))}
                workspaceId={workspaceId}
                currentUserId={user.id}
                canManage={canManage}
              />
            </section>

            {/* Pending invites */}
            {workspace.invites.length > 0 && (
              <section className="db-section">
                <div className="db-section-header">
                  <span className="badge">Pending invites ({workspace.invites.length})</span>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Email</th><th>Role</th><th>Expires</th></tr>
                    </thead>
                    <tbody>
                      {workspace.invites.map((inv) => (
                        <tr key={inv.id}>
                          <td>{inv.email}</td>
                          <td><span className="pill">{inv.role}</span></td>
                          <td className="table-subtitle">
                            {inv.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          {/* Invite form */}
          {canManage && (
            <aside>
              <div className="db-widget">
                <InviteMemberForm workspaceId={workspaceId} workspaceName={workspace.name} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
