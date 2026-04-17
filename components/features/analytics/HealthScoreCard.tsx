import type { DashboardTask, DashboardStats } from "@/lib/services/dashboard";

type Level = "HEALTHY" | "AT_RISK" | "DELAYED";

const LEVEL_META: Record<Level, { emoji: string; label: string; ringCls: string; labelCls: string }> = {
  HEALTHY: { emoji: "🟢", label: "Healthy",  ringCls: "health-ring-healthy", labelCls: "health-label-healthy" },
  AT_RISK: { emoji: "🟡", label: "At Risk",  ringCls: "health-ring-at-risk", labelCls: "health-label-at-risk" },
  DELAYED: { emoji: "🔴", label: "Delayed",  ringCls: "health-ring-delayed", labelCls: "health-label-delayed" },
};

function computeHealth(stats: DashboardStats, tasks: DashboardTask[]): { score: number; level: Level } {
  if (tasks.length === 0) return { score: 100, level: "HEALTHY" };
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
  let score = 100;
  score -= Math.min(40, stats.overdue * 8);
  score -= Math.min(20, blocked * 5);
  score -= Math.min(10, stats.dueSoon * 2);
  score = Math.max(0, Math.round(score));
  const level: Level = score >= 75 ? "HEALTHY" : score >= 45 ? "AT_RISK" : "DELAYED";
  return { score, level };
}

function buildSignals(stats: DashboardStats, tasks: DashboardTask[]): string[] {
  const blocked    = tasks.filter((t) => t.status === "BLOCKED").length;
  const unassigned = tasks.filter((t) => !t.assignee && t.status !== "DONE").length;
  const signals: string[] = [];
  if (stats.overdue > 0) signals.push(`${stats.overdue} task${stats.overdue > 1 ? "s" : ""} overdue`);
  if (blocked > 0)       signals.push(`${blocked} task${blocked > 1 ? "s" : ""} blocked`);
  if (stats.dueSoon > 0) signals.push(`${stats.dueSoon} due within 72 h`);
  if (unassigned > 0)    signals.push(`${unassigned} open task${unassigned > 1 ? "s" : ""} unassigned`);
  if (signals.length === 0) signals.push("All tasks on track — great execution!");
  return signals;
}

function buildDailySummary(stats: DashboardStats, tasks: DashboardTask[]): string[] {
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
  const lines: string[] = [];
  lines.push(`${stats.activeTasks} active task${stats.activeTasks !== 1 ? "s" : ""} across ${stats.workspaces} workspace${stats.workspaces !== 1 ? "s" : ""}`);
  if (stats.overdue > 0)     lines.push(`${stats.overdue} overdue — needs attention`);
  if (blocked > 0)           lines.push(`${blocked} blocked`);
  if (stats.dueSoon > 0)     lines.push(`${stats.dueSoon} due within 72 hours`);
  if (stats.urgent > 0)      lines.push(`${stats.urgent} high-priority open`);
  lines.push(`${stats.completionRate}% completion rate`);
  return lines;
}

type Props = { stats: DashboardStats; tasks: DashboardTask[] };

export function HealthScoreCard({ stats, tasks }: Props) {
  const { score, level } = computeHealth(stats, tasks);
  const meta    = LEVEL_META[level];
  const signals = buildSignals(stats, tasks);
  const summary = buildDailySummary(stats, tasks);

  return (
    <section className="db-section" style={{ padding: 0, background: "none", border: "none", boxShadow: "none" }}>
      <div className="health-score-grid">

        {/* ── Health Score ── */}
        <div className="health-card">
          <div className={`health-ring ${meta.ringCls}`}>
            <span className="health-ring-score">{score}</span>
            <span className="health-ring-pct">/ 100</span>
          </div>
          <div className="health-info">
            <div className="health-level-row">
              <span>{meta.emoji}</span>
              <span className={meta.labelCls}>Project Health — {meta.label}</span>
            </div>
            <ul className="health-signals">
              {signals.map((s, i) => (
                <li key={i} className="health-signal">• {s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Daily Summary ── */}
        <div className="daily-summary-card">
          <div className="daily-summary-header">
            <span className="badge accent">Today</span>
            <strong style={{ fontSize: "0.9rem" }}>Daily snapshot</strong>
          </div>
          <div className="daily-summary-items">
            {summary.map((line, i) => (
              <div key={i} className={`daily-summary-item${i === summary.length - 1 ? " daily-summary-ok" : ""}`}>
                {line}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
