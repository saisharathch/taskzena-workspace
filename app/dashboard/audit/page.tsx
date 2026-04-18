import Link from "next/link";
import { AuditLogFeed } from "@/components/features/audit/AuditLogFeed";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { buildCursorPage } from "@/lib/pagination";

const ACTION_LABELS: Record<string, string> = {
  "task.created": "Task created",
  "task.status_changed": "Task moved",
  "task.updated": "Task updated",
  "task.deleted": "Task deleted",
  "task.completed": "Task completed",
  "comment.added": "Comment added",
  "workspace.created": "Workspace created",
  "workspace.member_invited": "Member invited",
  "workspace.member_joined": "Member joined",
  "workspace.member_removed": "Member removed",
  "workspace.member_role_updated": "Member role updated",
  "project.created": "Project created",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string; action?: string }>;
}) {
  const user = await requireAppUser();
  const sp = await searchParams;
  const pageSize = 30;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const workspaceIds = memberships.map((membership) => membership.workspaceId);

  const where = {
    workspaceId: { in: workspaceIds },
    ...(sp.workspace ? { workspaceId: sp.workspace } : {}),
    ...(sp.action ? { action: sp.action } : {}),
  };

  const [logs, total, uniqueActionRows] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        createdAt: true,
        actor: { select: { fullName: true, email: true } },
        task: { select: { title: true } },
        workspace: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: pageSize + 1,
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where: {
        workspaceId: { in: workspaceIds },
      },
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
  ]);

  const page = buildCursorPage(logs, pageSize);
  const uniqueActions = uniqueActionRows.map((row) => row.action);

  return (
    <main className="db-shell">
      <section className="db-header">
        <div className="container">
          <nav className="db-topbar">
            <Link href="/dashboard" className="db-brand-link">
              <span className="db-brand-icon" style={{ fontSize: "0.65rem", letterSpacing: 0 }}>
                TZ
              </span>
              <span className="db-brand-name">TaskZen</span>
            </Link>
            <div className="db-topbar-actions">
              <Link href="/dashboard/reports" className="button secondary">
                Reports
              </Link>
              <Link href="/dashboard" className="button secondary">
                Back to Dashboard
              </Link>
            </div>
          </nav>
          <div style={{ paddingBottom: "1.75rem" }}>
            <h1 className="db-greeting-name" style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)" }}>
              Audit log
            </h1>
            <p className="db-greeting-sub">
              {total} event{total !== 1 ? "s" : ""} across your workspaces
            </p>
          </div>
        </div>
      </section>

      <div className="container db-body">
        <form method="GET" className="db-filters">
          <select name="workspace" className="select db-filter-select" defaultValue={sp.workspace ?? ""}>
            <option value="">All workspaces</option>
            {memberships.map((membership) => (
              <option key={membership.workspaceId} value={membership.workspaceId}>
                {membership.workspace.name}
              </option>
            ))}
          </select>
          <select name="action" className="select db-filter-select" defaultValue={sp.action ?? ""}>
            <option value="">All actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {ACTION_LABELS[action] ?? action}
              </option>
            ))}
          </select>
          <button className="button" type="submit">
            Filter
          </button>
          <Link href="/dashboard/audit" className="button secondary">
            Clear
          </Link>
        </form>

        <AuditLogFeed
          initialLogs={page.data}
          initialNextCursor={page.nextCursor}
          workspace={sp.workspace ?? ""}
          action={sp.action ?? ""}
          actionLabels={ACTION_LABELS}
        />
      </div>
    </main>
  );
}
