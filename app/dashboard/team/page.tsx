import Link from "next/link";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getDashboardData } from "@/lib/services/dashboard";
import { TeamManagementPanel } from "@/components/features/team/TeamManagementPanel";
import { WorkloadUrgentSection } from "@/components/features/analytics/WorkloadUrgentSection";

export default async function TeamPage() {
  const user = await requireAppUser();
  const data = await getDashboardData(user.id);
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              memberships: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const manageableWorkspace = memberships.find(
    (membership) => membership.role === "OWNER" || membership.role === "ADMIN",
  );
  const inviteHref = manageableWorkspace
    ? `/dashboard/team?invite=1#team-management`
    : "/dashboard/team#team-management";

  return (
    <div className="dash-page">
      <section className="team-page-hero">
        <div className="team-page-hero-copy">
          <span className="badge accent">Team</span>
          <h1 className="dash-page-title">Collaboration, capacity, and next steps</h1>
          <p className="dash-page-subtitle">
            See who is on the team, where work is concentrated, and what to do next to keep
            collaboration moving.
          </p>
        </div>

        <div className="team-page-actions">
          <Link className="button" href={inviteHref}>
            + Invite Teammate
          </Link>
          <Link className="button secondary" href="/dashboard/tasks">
            Go to Tasks
          </Link>
        </div>
      </section>

      <section className="team-page-overview">
        <div className="team-page-summary">
          <article className="team-summary-card team-summary-card--highlight">
            <span className="team-summary-label">Team members</span>
            <strong className="team-summary-value">{data.stats.teamMembers}</strong>
            <p className="team-summary-copy">
              Collaborators active across your workspaces and projects.
            </p>
          </article>
          <article className="team-summary-card">
            <span className="team-summary-label">Open tasks</span>
            <strong className="team-summary-value">{data.stats.activeTasks}</strong>
            <p className="team-summary-copy">Work currently in flight that needs active ownership.</p>
          </article>
          <article className="team-summary-card">
            <span className="team-summary-label">High priority</span>
            <strong className="team-summary-value">{data.stats.urgent}</strong>
            <p className="team-summary-copy">Items that likely need the team’s attention first.</p>
          </article>
        </div>

        <aside className="team-collab-card">
          <span className="team-collab-kicker">Collaboration pulse</span>
          <h2 className="team-collab-title">
            {data.stats.teamMembers > 0
              ? "Your team space is ready for coordinated work"
              : "Start by bringing one teammate into the workspace"}
          </h2>
          <p className="team-collab-copy">
            {data.stats.teamMembers > 0
              ? "Invite collaborators, assign clear owners, and use the workload view to keep capacity balanced."
              : "The Team page becomes much more useful once invites are out and work is assigned across people."}
          </p>
          <div className="team-collab-actions">
            <Link className="button" href={inviteHref}>
              Invite now
            </Link>
            <Link className="button secondary" href="/dashboard/tasks">
              Review tasks
            </Link>
          </div>
        </aside>
      </section>

      <TeamManagementPanel
        workspaces={memberships.map((membership) => ({
          id: membership.workspaceId,
          name: membership.workspace.name,
          role: membership.role,
          canManage: membership.role === "OWNER" || membership.role === "ADMIN",
          memberCount: membership.workspace._count.memberships,
        }))}
      />

      <WorkloadUrgentSection tasks={data.tasks} />
    </div>
  );
}
