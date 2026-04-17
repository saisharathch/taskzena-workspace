import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { BarChart } from "./BarChart";
import { DonutChart } from "./DonutChart";

export default async function ReportsPage() {
  const user = await requireAppUser();

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    select: { workspaceId: true, workspace: { select: { name: true } } },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const noWorkspaces = workspaceIds.length === 0;

  const tasks = noWorkspaces
    ? []
    : await prisma.task.findMany({
        where: { project: { workspaceId: { in: workspaceIds } } },
        select: { status: true, priority: true, createdAt: true, dueDate: true, project: { select: { workspaceId: true } } },
      });

  // ── Status & priority counts ─────────────────────────────────────────────
  const statusCounts  = { TODO: 0, IN_PROGRESS: 0, BLOCKED: 0, DONE: 0 } as Record<string, number>;
  const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }       as Record<string, number>;
  tasks.forEach((t) => {
    statusCounts[t.status]    = (statusCounts[t.status]    ?? 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1;
  });

  // ── Tasks created per day — last 14 days ────────────────────────────────
  const now = Date.now();
  const throughput = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 86_400_000);
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 0,
    };
  });
  tasks.forEach((t) => {
    const age = Math.floor((now - t.createdAt.getTime()) / 86_400_000);
    if (age >= 0 && age < 14) throughput[13 - age].value += 1;
  });

  // ── Per-workspace task counts ────────────────────────────────────────────
  const wsTaskCounts = await Promise.all(
    memberships.map(async (m) => {
      const count = await prisma.task.count({
        where: { project: { workspaceId: m.workspaceId } },
      });
      return { label: m.workspace.name, value: count };
    })
  );

  // ── KPI totals ───────────────────────────────────────────────────────────
  const total    = tasks.length;
  const done     = statusCounts.DONE;
  const overdue  = tasks.filter((t) => t.dueDate && t.dueDate < new Date() && t.status !== "DONE").length;
  const inFlight = statusCounts.IN_PROGRESS;
  const rate     = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <h1 className="dash-page-title">Reports</h1>
        <p className="dash-page-subtitle">
          Task throughput, status distribution, and workspace comparison.
        </p>
      </div>

      {/* ── KPI cards ── */}
      <div className="db-stats-grid">
        {[
          { label: "Total tasks",   value: total,    note: "All time",                         accent: "neutral" },
          { label: "Completed",     value: done,     note: `${rate}% completion rate`,          accent: "success" },
          { label: "In progress",   value: inFlight, note: "Currently active",                  accent: "neutral" },
          { label: "Overdue",       value: overdue,  note: "Past deadline, not done",           accent: overdue > 0 ? "danger" : "neutral" },
        ].map((s) => (
          <article key={s.label} className={`db-stat-card db-stat-${s.accent}`}>
            <span className="db-stat-label">{s.label}</span>
            <p className="db-stat-value">{s.value}</p>
            <p className="db-stat-note">{s.note}</p>
          </article>
        ))}
      </div>

      {noWorkspaces ? (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          No workspaces yet — create one from the dashboard to start seeing reports.
        </div>
      ) : (
        <div className="reports-grid">

          {/* ── Throughput bar chart ── */}
          <section className="db-section">
            <div className="db-section-header">
              <div>
                <span className="badge accent">Throughput</span>
                <h2 className="db-widget-title" style={{ marginTop: "0.35rem" }}>
                  Tasks created — last 14 days
                </h2>
              </div>
            </div>
            <BarChart data={throughput} color="var(--accent)" />
          </section>

          {/* ── Workspace comparison ── */}
          <section className="db-section">
            <div className="db-section-header">
              <div>
                <span className="badge">Workspaces</span>
                <h2 className="db-widget-title" style={{ marginTop: "0.35rem" }}>
                  Tasks by workspace
                </h2>
              </div>
            </div>
            {wsTaskCounts.every((w) => w.value === 0) ? (
              <div className="chart-empty">
                <p className="helper-text">No tasks in any workspace yet.</p>
              </div>
            ) : (
              <BarChart data={wsTaskCounts} color="#c4956a" />
            )}
          </section>

          {/* ── Status donut ── */}
          <section className="db-section">
            <div className="db-section-header">
              <div>
                <span className="badge">Status</span>
                <h2 className="db-widget-title" style={{ marginTop: "0.35rem" }}>
                  Status distribution
                </h2>
              </div>
            </div>
            <DonutChart
              data={[
                { label: "Todo",        value: statusCounts.TODO,        color: "#a09488" },
                { label: "In progress", value: statusCounts.IN_PROGRESS, color: "#2563eb" },
                { label: "Blocked",     value: statusCounts.BLOCKED,     color: "#dc2626" },
                { label: "Done",        value: statusCounts.DONE,        color: "#16a34a" },
              ]}
            />
          </section>

          {/* ── Priority donut ── */}
          <section className="db-section">
            <div className="db-section-header">
              <div>
                <span className="badge">Priority</span>
                <h2 className="db-widget-title" style={{ marginTop: "0.35rem" }}>
                  Priority distribution
                </h2>
              </div>
            </div>
            <DonutChart
              data={[
                { label: "Low",    value: priorityCounts.LOW,    color: "#a09488" },
                { label: "Medium", value: priorityCounts.MEDIUM, color: "#c4956a" },
                { label: "High",   value: priorityCounts.HIGH,   color: "#92400e" },
                { label: "Urgent", value: priorityCounts.URGENT, color: "#dc2626" },
              ]}
            />
          </section>

        </div>
      )}
    </div>
  );
}
