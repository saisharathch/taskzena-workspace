import type { DashboardTask, DashboardStats, DashboardWorkspace } from "@/lib/services/dashboard";

// ── Types ─────────────────────────────────────────────────────────────────────

type InsightLevel = "critical" | "warning" | "suggestion" | "positive";

type Insight = {
  id: string;
  level: InsightLevel;
  icon: string;
  headline: string;
  detail: string;
  tag?: string; // e.g., "3 tasks", "+12%"
};

// ── Rule engine ───────────────────────────────────────────────────────────────

function generateInsights(
  tasks: DashboardTask[],
  stats: DashboardStats,
  _workspaces: DashboardWorkspace[],
): Insight[] {
  const insights: Insight[] = [];
  const now = Date.now();

  // ── 1. Overdue tasks (critical if ≥3, warning if 1–2) ──
  if (stats.overdue >= 3) {
    insights.push({
      id: "overdue-critical",
      level: "critical",
      icon: "🚨",
      headline: `${stats.overdue} overdue tasks may derail your sprint`,
      detail: "These tasks are past their deadline and still open. Review and reprioritize immediately.",
      tag: `${stats.overdue} tasks`,
    });
  } else if (stats.overdue > 0) {
    insights.push({
      id: "overdue-warn",
      level: "warning",
      icon: "⏰",
      headline: `${stats.overdue} task${stats.overdue > 1 ? "s are" : " is"} overdue`,
      detail: "Address these before they create downstream delays for the rest of the team.",
      tag: `${stats.overdue} task${stats.overdue > 1 ? "s" : ""}`,
    });
  }

  // ── 2. Project at most risk (project with most overdue tasks) ──
  const overdueByProject = new Map<string, { name: string; count: number }>();
  for (const t of tasks) {
    if (t.dueDate && t.dueDate.getTime() < now && t.status !== "DONE") {
      const existing = overdueByProject.get(t.project.id);
      if (existing) {
        existing.count++;
      } else {
        overdueByProject.set(t.project.id, { name: t.project.name, count: 1 });
      }
    }
  }
  const riskiestProject = [...overdueByProject.values()].sort((a, b) => b.count - a.count)[0];
  if (riskiestProject && riskiestProject.count >= 2) {
    insights.push({
      id: "project-risk",
      level: "critical",
      icon: "🚨",
      headline: `Project "${riskiestProject.name}" is at risk`,
      detail: `${riskiestProject.count} overdue tasks are piling up. Review the project timeline and reassign if needed.`,
      tag: `${riskiestProject.count} overdue`,
    });
  }

  // ── 3. Blocked tasks ──
  const blocked = tasks.filter((t) => t.status === "BLOCKED");
  if (blocked.length > 0) {
    const sample = blocked
      .slice(0, 2)
      .map((t) => `"${t.title}"`)
      .join(", ");
    const more = blocked.length > 2 ? ` and ${blocked.length - 2} more` : "";
    insights.push({
      id: "blocked",
      level: "warning",
      icon: "⚠️",
      headline: `${blocked.length} task${blocked.length > 1 ? "s are" : " is"} blocked and stalling progress`,
      detail: `Unblock: ${sample}${more}. Every blocked task stops dependent work.`,
      tag: `${blocked.length} blocked`,
    });
  }

  // ── 4. Workload imbalance (anyone with >1.8× the team average) ──
  const openByAssignee = new Map<string, { name: string; count: number }>();
  for (const t of tasks) {
    if (t.assignee && t.status !== "DONE") {
      const name = t.assignee.fullName ?? t.assignee.email ?? "Unknown";
      const existing = openByAssignee.get(t.assignee.id);
      if (existing) existing.count++;
      else openByAssignee.set(t.assignee.id, { name, count: 1 });
    }
  }
  const topMember = [...openByAssignee.values()].sort((a, b) => b.count - a.count)[0];
  const avgLoad = stats.activeTasks / Math.max(stats.teamMembers, 1);
  if (topMember && topMember.count >= 4 && topMember.count > avgLoad * 1.8) {
    insights.push({
      id: "overload",
      level: "warning",
      icon: "⚠️",
      headline: `${topMember.name} may be overloaded`,
      detail: `They hold ${topMember.count} open tasks — ${Math.round((topMember.count / avgLoad - 1) * 100)}% above the team average. Consider redistributing.`,
      tag: `${topMember.count} tasks`,
    });
  }

  // ── 5. Due soon (next 72 h) ──
  if (stats.dueSoon > 0 && insights.length < 4) {
    insights.push({
      id: "due-soon",
      level: "warning",
      icon: "⏰",
      headline: `${stats.dueSoon} task${stats.dueSoon > 1 ? "s" : ""} due within 72 hours`,
      detail: "Deadlines are approaching fast. Confirm assignees are aware and have what they need.",
      tag: "Due soon",
    });
  }

  // ── 6. High-priority suggestion ──
  if (stats.urgent >= 3 && insights.length < 5) {
    insights.push({
      id: "high-priority",
      level: "suggestion",
      icon: "💡",
      headline: `${stats.urgent} high-priority tasks still open`,
      detail: "Focus the team on urgent items first to protect delivery velocity. Assign clear owners.",
      tag: `${stats.urgent} urgent`,
    });
  }

  // ── 7. Positive: strong week ──
  if (stats.completedThisWeek >= 3) {
    insights.push({
      id: "progress",
      level: "positive",
      icon: "📈",
      headline: `Strong week — ${stats.completedThisWeek} tasks shipped`,
      detail: `Your team closed ${stats.completedThisWeek} tasks in the last 7 days. Overall completion rate is ${stats.completionRate}%. Keep the momentum.`,
      tag: `+${stats.completedThisWeek} this week`,
    });
  } else if (stats.completionRate >= 75 && insights.length < 5) {
    insights.push({
      id: "completion",
      level: "positive",
      icon: "📈",
      headline: `Completion rate is healthy at ${stats.completionRate}%`,
      detail: "The team is consistently finishing work. Great time to plan the next batch.",
      tag: `${stats.completionRate}%`,
    });
  }

  // ── 8. All clear fallback ──
  if (insights.length === 0) {
    insights.push({
      id: "all-clear",
      level: "positive",
      icon: "✅",
      headline: "No risk signals — everything looks on track",
      detail: "No overdue tasks, no blockers, no overloaded members. Good moment to scope the next sprint.",
    });
  }

  return insights.slice(0, 5);
}

// ── Level metadata ─────────────────────────────────────────────────────────────

const LEVEL_META: Record<InsightLevel, { label: string; rowClass: string; tagClass: string }> = {
  critical:   { label: "Critical",   rowClass: "si-row si-critical",   tagClass: "si-tag si-tag-critical" },
  warning:    { label: "Warning",    rowClass: "si-row si-warning",    tagClass: "si-tag si-tag-warning" },
  suggestion: { label: "Suggestion", rowClass: "si-row si-suggestion", tagClass: "si-tag si-tag-suggestion" },
  positive:   { label: "Positive",   rowClass: "si-row si-positive",   tagClass: "si-tag si-tag-positive" },
};

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  tasks: DashboardTask[];
  stats: DashboardStats;
  workspaces: DashboardWorkspace[];
};

export function SmartInsightsPanel({ tasks, stats, workspaces }: Props) {
  const insights = generateInsights(tasks, stats, workspaces);

  return (
    <section className="si-panel" aria-label="AI Insights">
      {/* Header */}
      <div className="si-header">
        <div className="si-header-left">
          <span className="badge accent">AI Insights</span>
          <h2 className="si-title">Smart signal summary</h2>
        </div>
        <span className="si-meta">
          {insights.length} signal{insights.length !== 1 ? "s" : ""} detected
        </span>
      </div>

      {/* Insight rows */}
      <div className="si-list" role="list">
        {insights.map((ins) => {
          const meta = LEVEL_META[ins.level];
          return (
            <div key={ins.id} className={meta.rowClass} role="listitem">
              {/* Icon bubble */}
              <span className="si-icon" aria-hidden="true">{ins.icon}</span>

              {/* Content */}
              <div className="si-content">
                <div className="si-top">
                  <p className="si-headline">{ins.headline}</p>
                  {ins.tag && (
                    <span className={meta.tagClass}>{ins.tag}</span>
                  )}
                </div>
                <p className="si-detail">{ins.detail}</p>
              </div>

              {/* Level label (right edge) */}
              <span className="si-level-label">{meta.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
