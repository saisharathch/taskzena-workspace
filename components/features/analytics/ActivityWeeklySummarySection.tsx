"use client";

import { useState } from "react";
import type { DashboardActivity, DashboardStats, DashboardTask } from "@/lib/services/dashboard";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const ms      = Date.now() - date.getTime();
  const minutes = Math.floor(ms / 60_000);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  if (days > 6)    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  if (days > 0)    return `${days}d ago`;
  if (hours > 0)   return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

const ACTION_META: Record<string, { icon: string; label: string; category: "tasks" | "comments" | "projects" }> = {
  "task.created":            { icon: "✦", label: "created task",    category: "tasks"    },
  "task.updated":            { icon: "✎", label: "updated task",    category: "tasks"    },
  "task.deleted":            { icon: "✕", label: "deleted task",    category: "tasks"    },
  "task.completed":          { icon: "✓", label: "completed task",  category: "tasks"    },
  "comment.added":           { icon: "💬", label: "commented on",   category: "comments" },
  "comment.created":         { icon: "💬", label: "commented on",   category: "comments" },
  "workspace.created":       { icon: "🏢", label: "created workspace", category: "projects" },
  "workspace.member_joined": { icon: "👤", label: "joined workspace",  category: "projects" },
  "project.created":         { icon: "📁", label: "created project",   category: "projects" },
};

type FilterTab = "all" | "tasks" | "comments" | "projects";

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: "all",      label: "All"      },
  { key: "tasks",    label: "Tasks"    },
  { key: "comments", label: "Comments" },
  { key: "projects", label: "Projects" },
];

// ── Activity Timeline ─────────────────────────────────────────────────────────

export function ActivityTimeline({ activity }: { activity: DashboardActivity[] }) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showAll, setShowAll] = useState(false);
  const PAGE = 8;

  const filtered = activity.filter((item) => {
    if (filter === "all") return true;
    return ACTION_META[item.action]?.category === filter;
  });

  const displayed = showAll ? filtered : filtered.slice(0, PAGE);

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div>
          <span className="badge accent">Live feed</span>
          <h3 className="panel-title">Activity timeline</h3>
        </div>
        <span className="panel-meta">{activity.length} events</span>
      </div>

      {/* Filter tabs */}
      <div className="atl-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`atl-tab ${filter === f.key ? "atl-tab-active" : ""}`}
            onClick={() => { setFilter(f.key); setShowAll(false); }}
            suppressHydrationWarning
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline list */}
      <div className="atl-list">
        {displayed.length === 0 ? (
          <div className="atl-empty">No {filter === "all" ? "" : filter} activity yet.</div>
        ) : (
          displayed.map((item, i) => {
            const meta  = ACTION_META[item.action];
            const icon  = meta?.icon ?? "•";
            const label = meta?.label ?? item.action.replace(/[._]/g, " ");
            const actor = item.actor?.fullName ?? item.actor?.email ?? "System";
            const isLast = i === displayed.length - 1;

            return (
              <div key={item.id} className={`atl-item ${isLast ? "atl-item-last" : ""}`}>
                {/* Vertical line + icon */}
                <div className="atl-track">
                  <span className="atl-dot">{icon}</span>
                  {!isLast && <span className="atl-line" />}
                </div>

                {/* Content */}
                <div className="atl-content">
                  <p className="atl-text">
                    <strong className="atl-actor">{actor}</strong>
                    {" "}{label}
                    {item.task && (
                      <span className="atl-task-name"> "{item.task.title}"</span>
                    )}
                  </p>
                  <span className="atl-time">{timeAgo(item.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Show more */}
      {filtered.length > PAGE && !showAll && (
        <button
          className="atl-more-btn"
          onClick={() => setShowAll(true)}
          suppressHydrationWarning
        >
          Show {filtered.length - PAGE} more events
        </button>
      )}
    </div>
  );
}

// ── Weekly Summary ────────────────────────────────────────────────────────────

type SummaryMetric = {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  level: "positive" | "warning" | "danger" | "neutral";
};

export function WeeklySummary({ stats, tasks }: { stats: DashboardStats; tasks: DashboardTask[] }) {
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;

  const risk =
    stats.overdue >= 3   ? `${stats.overdue} overdue tasks may impact delivery`
    : blocked > 0        ? `${blocked} blocked task${blocked > 1 ? "s" : ""} stalling progress`
    : stats.urgent >= 3  ? `${stats.urgent} high-priority items still open`
    : null;

  const metrics: SummaryMetric[] = [
    {
      icon: "✅", label: "Completed this week",
      value: stats.completedThisWeek,
      sub: `${stats.completedTasks} total done`,
      level: stats.completedThisWeek > 0 ? "positive" : "neutral",
    },
    {
      icon: "⏰", label: "Overdue tasks",
      value: stats.overdue,
      sub: stats.overdue > 0 ? "Needs attention" : "All on track",
      level: stats.overdue >= 3 ? "danger" : stats.overdue > 0 ? "warning" : "positive",
    },
    {
      icon: "📈", label: "Completion rate",
      value: `${stats.completionRate}%`,
      sub: `${stats.activeTasks} tasks still open`,
      level: stats.completionRate >= 75 ? "positive" : stats.completionRate >= 40 ? "warning" : "neutral",
    },
    {
      icon: "🔥", label: "High priority open",
      value: stats.urgent,
      sub: "Urgent + high",
      level: stats.urgent >= 3 ? "danger" : stats.urgent > 0 ? "warning" : "positive",
    },
  ];

  const LEVEL_CLS: Record<string, string> = {
    positive: "ws-metric-positive",
    warning:  "ws-metric-warning",
    danger:   "ws-metric-danger",
    neutral:  "ws-metric-neutral",
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div>
          <span className="badge accent">Executive</span>
          <h3 className="panel-title">Weekly summary</h3>
        </div>
        <span className="panel-meta">
          {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date())}
        </span>
      </div>

      {/* Metric grid */}
      <div className="ws-metrics">
        {metrics.map((m) => (
          <div key={m.label} className={`ws-metric ${LEVEL_CLS[m.level]}`}>
            <span className="ws-metric-icon">{m.icon}</span>
            <div className="ws-metric-body">
              <span className="ws-metric-value">{m.value}</span>
              <span className="ws-metric-label">{m.label}</span>
              {m.sub && <span className="ws-metric-sub">{m.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Risk callout */}
      {risk ? (
        <div className="ws-risk">
          <span className="ws-risk-icon">🚨</span>
          <div>
            <p className="ws-risk-label">Key risk</p>
            <p className="ws-risk-text">{risk}</p>
          </div>
        </div>
      ) : (
        <div className="ws-risk ws-risk-clear">
          <span className="ws-risk-icon">✅</span>
          <div>
            <p className="ws-risk-label">Status</p>
            <p className="ws-risk-text">No critical risks — delivery looks healthy</p>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Section export ────────────────────────────────────────────────────────────

type Props = {
  activity: DashboardActivity[];
  stats: DashboardStats;
  tasks: DashboardTask[];
};

export function ActivityWeeklySummarySection({ activity, stats, tasks }: Props) {
  return (
    <div className="aws-grid">
      <ActivityTimeline activity={activity} />
      <WeeklySummary    stats={stats} tasks={tasks} />
    </div>
  );
}
