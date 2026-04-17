"use client";

import { useState } from "react";
import type { DashboardActivity, DashboardWorkspace, DashboardTask } from "@/lib/services/dashboard";

type Props = {
  activity: DashboardActivity[];
  workspaces: DashboardWorkspace[];
  tasks: DashboardTask[];
};

// ── Workload helpers ─────────────────────────────────────────────────────────

const WL_COLORS = [
  "#2563eb","#16a34a","#dc2626","#d97706","#7c3aed","#0891b2","#be185d","#059669",
];

function wlColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return WL_COLORS[Math.abs(h) % WL_COLORS.length];
}

function wlInitials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0][0].toUpperCase();
}

const PAGE_SIZE = 5;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    "task.created":            "Created a task",
    "task.updated":            "Updated a task",
    "task.deleted":            "Deleted a task",
    "task.completed":          "Completed a task",
    "comment.added":           "Added a comment",
    "comment.created":         "Added a comment",
    "workspace.created":       "Created workspace",
    "workspace.member_joined": "Member joined",
    "project.created":         "Created a project",
  };
  return map[action] ?? action.replace(/[._]/g, " ");
}

const ACTION_ICON: Record<string, string> = {
  "task.created":            "✦",
  "task.updated":            "✎",
  "task.deleted":            "✕",
  "task.completed":          "✓",
  "comment.added":           "💬",
  "comment.created":         "💬",
  "workspace.created":       "🏢",
  "workspace.member_joined": "👤",
  "project.created":         "📁",
};

export function RecentActivity({ activity, workspaces, tasks }: Props) {
  const [page, setPage] = useState(0);

  // ── Team Workload computation ──────────────────────────────────────────────
  const now = Date.now();
  const activeTasks = tasks.filter((t) => t.status !== "DONE");
  const wlMap = new Map<string, { name: string; total: number; overdue: number }>();
  for (const task of activeTasks) {
    const name = task.assignee?.fullName ?? task.assignee?.email ?? "Unassigned";
    if (!wlMap.has(name)) wlMap.set(name, { name, total: 0, overdue: 0 });
    const entry = wlMap.get(name)!;
    entry.total++;
    if (task.dueDate && task.dueDate.getTime() < now) entry.overdue++;
  }
  const workloadEntries = Array.from(wlMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 7);
  const maxTasks = Math.max(...workloadEntries.map((e) => e.total), 1);

  const totalPages = Math.ceil(activity.length / PAGE_SIZE);
  const pageItems  = activity.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const start      = page * PAGE_SIZE + 1;
  const end        = Math.min(start + PAGE_SIZE - 1, activity.length);

  return (
    <aside className="db-sidebar">

      {/* ── Team Workload ── */}
      <section className="db-widget">
        <div className="db-widget-header">
          <span className="badge">Team</span>
          <h2 className="db-widget-title">Workload</h2>
        </div>
        {workloadEntries.length === 0 ? (
          <div className="empty-state">No active tasks assigned yet.</div>
        ) : (
          <div className="workload-list">
            {workloadEntries.map((e) => {
              const isUnassigned = e.name === "Unassigned";
              const color = isUnassigned ? "var(--muted)" : wlColor(e.name);
              return (
                <div key={e.name} className="workload-row">
                  <div
                    className="workload-avatar"
                    style={{ background: isUnassigned ? "var(--border)" : color, color: isUnassigned ? "var(--muted)" : "#fff" }}
                  >
                    {isUnassigned ? "?" : wlInitials(e.name)}
                  </div>
                  <span className="workload-name" title={e.name}>{e.name}</span>
                  <div className="workload-bar-track">
                    <div
                      className="workload-bar-fill"
                      style={{ width: `${(e.total / maxTasks) * 100}%`, background: color }}
                    />
                  </div>
                  <span className={`workload-count${e.total >= 8 ? " workload-overload" : ""}`}>
                    {e.total}{e.overdue > 0 ? ` (${e.overdue}⚠)` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Workspace health ── */}
      <section className="db-widget">
        <div className="db-widget-header">
          <span className="badge">Workspaces</span>
          <h2 className="db-widget-title">Portfolio health</h2>
        </div>

        {workspaces.length ? (
          <div className="db-workspace-list">
            {workspaces.map((ws) => (
              <article key={ws.id} className="db-workspace-card">
                <div className="db-ws-top">
                  <strong className="db-ws-name">{ws.name}</strong>
                  <span className={`db-ws-rate ${ws.completion >= 75 ? "db-ws-rate-good" : ws.completion >= 40 ? "db-ws-rate-mid" : "db-ws-rate-low"}`}>
                    {ws.completion}%
                  </span>
                </div>
                <div className="db-ws-meta">
                  {ws.projectCount} project{ws.projectCount !== 1 ? "s" : ""} · {ws.openTasks} open
                </div>
                <div className="db-ws-bar-track">
                  <div className="db-ws-bar-fill" style={{ width: `${ws.completion}%` }} />
                </div>
                <p className="db-ws-activity">{ws.latestActivity}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">No workspaces yet. Create one to start tracking.</div>
        )}
      </section>

      {/* ── Recent activity ── */}
      <section className="db-widget">
        <div className="db-widget-header">
          <span className="badge">Activity</span>
          <h2 className="db-widget-title">Audit trail</h2>
        </div>

        {activity.length ? (
          <>
            <div className="timeline">
              {pageItems.map((item) => (
                <article key={item.id} className="timeline-item">
                  <div className="timeline-row">
                    <span className="timeline-icon">
                      {ACTION_ICON[item.action] ?? "•"}
                    </span>
                    <div className="timeline-body">
                      <p className="timeline-title">{actionLabel(item.action)}</p>
                      {item.task && (
                        <p className="timeline-meta">"{item.task.title}"</p>
                      )}
                      <p className="timeline-meta">
                        {item.actor?.fullName ?? item.actor?.email ?? "System"} · {dateFmt.format(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="activity-pagination">
                <button
                  className="activity-page-btn"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  aria-label="Previous page"
                  suppressHydrationWarning
                >
                  ‹
                </button>
                <span className="activity-page-info">
                  {start}–{end} of {activity.length}
                </span>
                <button
                  className="activity-page-btn"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                  suppressHydrationWarning
                >
                  ›
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">Activity will appear here once your team starts working.</div>
        )}
      </section>
    </aside>
  );
}
