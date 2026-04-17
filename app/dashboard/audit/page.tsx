import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric",
  hour: "numeric", minute: "2-digit",
});

const ACTION_LABELS: Record<string, string> = {
  "task.created":          "Task created",
  "task.updated":          "Task updated",
  "task.deleted":          "Task deleted",
  "task.completed":        "Task completed",
  "comment.added":         "Comment added",
  "workspace.created":     "Workspace created",
  "workspace.member_joined": "Member joined",
  "project.created":       "Project created",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string; action?: string; page?: string }>;
}) {
  const user = await requireAppUser();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const pageSize = 30;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const where = {
    workspaceId: { in: workspaceIds },
    ...(sp.workspace ? { workspaceId: sp.workspace } : {}),
    ...(sp.action ? { action: sp.action } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        actor: { select: { fullName: true, email: true } },
        task:  { select: { title: true } },
        workspace: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <main className="db-shell">
      {/* ── Page header ── */}
      <section className="db-header">
        <div className="container">
          <nav className="db-topbar">
            <Link href="/dashboard" className="db-brand-link">
              <span className="db-brand-icon" style={{ fontSize: "0.65rem", letterSpacing: 0 }}>TZ</span>
              <span className="db-brand-name">TaskZen</span>
            </Link>
            <div className="db-topbar-actions">
              <Link href="/dashboard/reports" className="button secondary">Reports</Link>
              <Link href="/dashboard"         className="button secondary">← Dashboard</Link>
            </div>
          </nav>
          <div style={{ paddingBottom: "1.75rem" }}>
            <h1 className="db-greeting-name" style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)" }}>Audit log</h1>
            <p className="db-greeting-sub">{total} event{total !== 1 ? "s" : ""} across your workspaces</p>
          </div>
        </div>
      </section>

      <div className="container db-body">

        {/* Filters */}
        <form method="GET" className="db-filters">
          <select name="workspace" className="select db-filter-select" defaultValue={sp.workspace ?? ""}>
            <option value="">All workspaces</option>
            {memberships.map((m) => (
              <option key={m.workspaceId} value={m.workspaceId}>{m.workspace.name}</option>
            ))}
          </select>
          <select name="action" className="select db-filter-select" defaultValue={sp.action ?? ""}>
            <option value="">All actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
            ))}
          </select>
          <button className="button" type="submit">Filter</button>
          <Link href="/dashboard/audit" className="button secondary">Clear</Link>
        </form>

        {/* Log table */}
        <section className="db-section">
          <div className="table-wrap">
            <table className="table audit-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Task</th>
                  <th>Workspace</th>
                </tr>
              </thead>
              <tbody>
                {logs.length ? logs.map((log) => (
                  <tr key={log.id}>
                    <td className="table-subtitle">
                      {dateFmt.format(log.createdAt)}
                    </td>
                    <td>
                      <span className="badge">{ACTION_LABELS[log.action] ?? log.action}</span>
                    </td>
                    <td>{log.actor?.fullName ?? log.actor?.email ?? <span className="table-subtitle">System</span>}</td>
                    <td>{log.task?.title ?? <span className="table-subtitle">—</span>}</td>
                    <td className="table-subtitle" title={log.workspace.name}>{log.workspace.name}</td>
                  </tr>
                )) : (
                  <tr><td className="table-empty" colSpan={5}>No activity found matching these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="db-pagination">
              {page > 1 && (
                <Link href={`/dashboard/audit?page=${page - 1}${sp.workspace ? `&workspace=${sp.workspace}` : ""}${sp.action ? `&action=${sp.action}` : ""}`} className="button secondary">← Prev</Link>
              )}
              <span className="helper-text">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/audit?page=${page + 1}${sp.workspace ? `&workspace=${sp.workspace}` : ""}${sp.action ? `&action=${sp.action}` : ""}`} className="button secondary">Next →</Link>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
