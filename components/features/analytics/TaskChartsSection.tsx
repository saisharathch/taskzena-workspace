"use client";

import { useMemo, useState } from "react";
import type { DashboardProject, DashboardTask } from "@/lib/services/dashboard";

const COLOR = {
  done: "#22c55e",
  inProgress: "#6366f1",
  blocked: "#ef4444",
  todo: "#cbd5e1",
};

type TimeRange = 7 | 30;

type ProjectSnapshot = {
  id: string;
  name: string;
  workspaceName: string;
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  todo: number;
  overdue: number;
  completion: number;
};

function formatDelta(value: number) {
  if (value === 0) return "Flat vs prior period";
  return `${value > 0 ? "+" : ""}${value} pts vs prior period`;
}

function getCompletionTone(rate: number) {
  if (rate >= 70) return "positive";
  if (rate >= 40) return "warning";
  return "risk";
}

function buildProjectSnapshots(tasks: DashboardTask[], projects: DashboardProject[], now: number): ProjectSnapshot[] {
  return projects
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.project.id === project.id);
      const done = projectTasks.filter((task) => task.status === "DONE").length;
      const inProgress = projectTasks.filter((task) => task.status === "IN_PROGRESS").length;
      const blocked = projectTasks.filter((task) => task.status === "BLOCKED").length;
      const todo = projectTasks.filter((task) => task.status === "TODO").length;
      const overdue = projectTasks.filter(
        (task) => task.dueDate && task.dueDate.getTime() < now && task.status !== "DONE",
      ).length;
      const total = projectTasks.length;

      return {
        id: project.id,
        name: project.name,
        workspaceName: project.workspaceName,
        total,
        done,
        inProgress,
        blocked,
        todo,
        overdue,
        completion: total ? Math.round((done / total) * 100) : 0,
      };
    })
    .filter((project) => project.total > 0);
}

function DonutChart({
  tasks,
  completionRate,
}: {
  tasks: DashboardTask[];
  completionRate: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = tasks.length;

  const segments = [
    { key: "done", label: "Completed", value: tasks.filter((task) => task.status === "DONE").length, color: COLOR.done },
    {
      key: "inProgress",
      label: "In Progress",
      value: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      color: COLOR.inProgress,
    },
    { key: "blocked", label: "Blocked", value: tasks.filter((task) => task.status === "BLOCKED").length, color: COLOR.blocked },
    { key: "todo", label: "To Do", value: tasks.filter((task) => task.status === "TODO").length, color: COLOR.todo },
  ];

  const cx = 120;
  const cy = 120;
  const r = 82;
  const sw = 30;
  const circ = 2 * Math.PI * r;
  const gap = 5;

  let offset = 0;
  const arcs = segments.map((segment) => {
    const pct = total > 0 ? segment.value / total : 0;
    const len = pct * circ;
    const arc = {
      ...segment,
      dasharray: `${Math.max(0, len - gap)} ${circ}`,
      dashoffset: -offset,
      pct: Math.round(pct * 100),
    };
    offset += len;
    return arc;
  });

  const hoveredSegment = hovered ? arcs.find((segment) => segment.key === hovered) : null;

  return (
    <div className="chart-card analytics-chart-card analytics-donut-card">
      <div className="chart-card-header analytics-chart-header">
        <div>
          <h3 className="chart-title">Completion mix</h3>
          <p className="chart-note">Current status distribution for tasks active in this period.</p>
        </div>
        <span className="chart-subtitle">{total} tasks</span>
      </div>

      <div className="donut-body analytics-donut-body">
        <div className="donut-svg-wrap analytics-donut-wrap">
          <svg viewBox="0 0 240 240" width="240" height="240" aria-hidden="true">
            <defs>
              <linearGradient id="analyticsDonutTrack" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
            </defs>

            <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#analyticsDonutTrack)" strokeWidth={sw} />

            {total > 0 &&
              arcs.map((arc) => (
                <circle
                  key={arc.key}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={hovered === arc.key ? sw + 5 : sw}
                  strokeDasharray={arc.dasharray}
                  strokeDashoffset={arc.dashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: "stroke-width 150ms ease", cursor: "pointer", opacity: hovered && hovered !== arc.key ? 0.55 : 1 }}
                  onMouseEnter={() => setHovered(arc.key)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}

            <circle cx={cx} cy={cy} r={53} fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="34" fontWeight="800" fill="#0f172a">
              {hoveredSegment ? `${hoveredSegment.pct}%` : `${completionRate}%`}
            </text>
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748b">
              {hoveredSegment ? hoveredSegment.label : "Completion"}
            </text>
          </svg>
        </div>

        <div className="donut-legend analytics-donut-legend">
          {arcs.map((segment) => (
            <div
              key={segment.key}
              className={`donut-legend-row analytics-legend-row ${hovered === segment.key ? "donut-legend-active" : ""}`}
              onMouseEnter={() => setHovered(segment.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="donut-legend-dot analytics-legend-dot" style={{ background: segment.color }} />
              <span className="donut-legend-label">{segment.label}</span>
              <span className="donut-legend-count">{segment.value}</span>
              <span className="donut-legend-pct">{total > 0 ? `${segment.pct}%` : "--"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({ projects }: { projects: ProjectSnapshot[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const sorted = [...projects].sort((a, b) => b.total - a.total).slice(0, 7);
  const maxVal = Math.max(...sorted.map((project) => project.total), 1);
  const tickCount = 5;
  const tickStep = Math.ceil(maxVal / tickCount) || 1;
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => index * tickStep);
  const yMax = ticks[ticks.length - 1];
  const barH = 260;

  return (
    <div className="chart-card analytics-chart-card analytics-bar-card">
      <div className="chart-card-header analytics-chart-header">
        <div>
          <h3 className="chart-title">Project momentum</h3>
          <p className="chart-note">Largest projects, stacked by current execution status.</p>
        </div>
        <span className="chart-subtitle">Top {sorted.length || 0} projects</span>
      </div>

      {sorted.length === 0 ? (
        <div className="chart-empty">No project data yet for this time range.</div>
      ) : (
        <>
          <div className="bar-chart-body analytics-bar-body">
            <div className="bar-y-axis" style={{ height: barH }}>
              {[...ticks].reverse().map((tick) => (
                <span key={tick} className="bar-y-tick">
                  {tick}
                </span>
              ))}
            </div>

            <div className="bar-area" style={{ height: barH }}>
              {ticks.map((tick) => (
                <div key={tick} className="bar-gridline" style={{ bottom: `${(tick / yMax) * 100}%` }} />
              ))}

              <div className="bar-columns analytics-bar-columns">
                {sorted.map((project) => {
                  const isHovered = hovered === project.id;
                  const scaledHeight = (value: number) => `${(value / yMax) * barH}px`;

                  return (
                    <div
                      key={project.id}
                      className={`bar-col analytics-bar-col ${isHovered ? "bar-col-hov" : ""}`}
                      onMouseEnter={() => setHovered(project.id)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div className="bar-stack analytics-bar-stack">
                        {project.todo > 0 && (
                          <div className="bar-seg" style={{ height: scaledHeight(project.todo), background: COLOR.todo }} />
                        )}
                        {project.blocked > 0 && (
                          <div className="bar-seg" style={{ height: scaledHeight(project.blocked), background: COLOR.blocked }} />
                        )}
                        {project.inProgress > 0 && (
                          <div className="bar-seg" style={{ height: scaledHeight(project.inProgress), background: COLOR.inProgress }} />
                        )}
                        {project.done > 0 && (
                          <div className="bar-seg bar-seg-top" style={{ height: scaledHeight(project.done), background: COLOR.done }} />
                        )}
                      </div>

                      {isHovered && (
                        <div className="bar-tooltip">
                          <strong>{project.name}</strong>
                          <span>{project.workspaceName}</span>
                          <span>Completed: {project.done}</span>
                          <span>In progress: {project.inProgress}</span>
                          {project.blocked > 0 && <span className="bar-tooltip-warn">Blocked: {project.blocked}</span>}
                          {project.overdue > 0 && <span className="bar-tooltip-warn">Overdue: {project.overdue}</span>}
                          <span className="bar-tooltip-pct">{project.completion}% complete</span>
                        </div>
                      )}

                      <span className="bar-x-label" title={project.name}>
                        {project.name.length > 12 ? `${project.name.slice(0, 11)}...` : project.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bar-legend analytics-bar-legend">
            {[
              { label: "Completed", color: COLOR.done },
              { label: "In Progress", color: COLOR.inProgress },
              { label: "Blocked", color: COLOR.blocked },
              { label: "To Do", color: COLOR.todo },
            ].map((item) => (
              <span key={item.label} className="bar-legend-item analytics-bar-legend-item">
                <span className="bar-legend-dot" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type Props = {
  tasks: DashboardTask[];
  projects: DashboardProject[];
};

export function TaskChartsSection({ tasks, projects }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  const analytics = useMemo(() => {
    const now = Date.now();
    const rangeMs = timeRange * 24 * 60 * 60 * 1000;
    const cutoff = now - rangeMs;
    const previousCutoff = cutoff - rangeMs;

    const filteredTasks = tasks.filter(
      (task) => task.createdAt.getTime() >= cutoff || task.updatedAt.getTime() >= cutoff,
    );

    const previousTasks = tasks.filter(
      (task) =>
        (task.createdAt.getTime() >= previousCutoff && task.createdAt.getTime() < cutoff) ||
        (task.updatedAt.getTime() >= previousCutoff && task.updatedAt.getTime() < cutoff),
    );

    const completed = filteredTasks.filter((task) => task.status === "DONE").length;
    const inProgress = filteredTasks.filter((task) => task.status === "IN_PROGRESS").length;
    const blocked = filteredTasks.filter((task) => task.status === "BLOCKED").length;
    const overdue = filteredTasks.filter(
      (task) => task.dueDate && task.dueDate.getTime() < now && task.status !== "DONE",
    ).length;
    const completedThisRange = tasks.filter(
      (task) => task.status === "DONE" && task.updatedAt.getTime() >= cutoff,
    ).length;
    const previousCompleted = tasks.filter(
      (task) =>
        task.status === "DONE" &&
        task.updatedAt.getTime() >= previousCutoff &&
        task.updatedAt.getTime() < cutoff,
    ).length;
    const createdThisRange = tasks.filter((task) => task.createdAt.getTime() >= cutoff).length;
    const dueSoon = filteredTasks.filter((task) => {
      if (!task.dueDate || task.status === "DONE") return false;
      const delta = task.dueDate.getTime() - now;
      return delta >= 0 && delta <= 5 * 24 * 60 * 60 * 1000;
    }).length;
    const highPriorityOpen = filteredTasks.filter(
      (task) => task.status !== "DONE" && ["HIGH", "URGENT"].includes(task.priority),
    ).length;

    const total = filteredTasks.length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const previousRate = previousTasks.length
      ? Math.round((previousTasks.filter((task) => task.status === "DONE").length / previousTasks.length) * 100)
      : 0;
    const completionDelta = completionRate - previousRate;

    const projectSnapshots = buildProjectSnapshots(filteredTasks, projects, now);
    const topProject = [...projectSnapshots]
      .filter((project) => project.total >= 2)
      .sort((a, b) => {
        if (b.completion !== a.completion) return b.completion - a.completion;
        return b.done - a.done;
      })[0] ?? null;

    const bottleneck = [...projectSnapshots]
      .sort((a, b) => (b.blocked + b.overdue) - (a.blocked + a.overdue))[0] ?? null;

    const insights = [
      {
        tone: getCompletionTone(completionRate),
        label: "Completion",
        value: `${completionRate}%`,
        text:
          completionRate >= 70
            ? `Delivery is moving well. ${formatDelta(completionDelta)} and ${completedThisRange} tasks closed in the last ${timeRange} days.`
            : `Completion is softer than ideal. ${formatDelta(completionDelta)} and ${createdThisRange - completedThisRange > 0 ? `${createdThisRange - completedThisRange} more tasks opened than closed.` : "output is roughly keeping pace."}`,
        action:
          completionRate >= 70
            ? "Keep current cadence and clear blocked items before pulling more work in."
            : "Trim in-progress work and prioritize finishing near-complete tasks.",
      },
      {
        tone: overdue + blocked > 0 ? "risk" : "positive",
        label: "Risk",
        value: `${overdue + blocked}`,
        text:
          overdue + blocked > 0
            ? `${overdue} overdue and ${blocked} blocked tasks are slowing delivery in this window.`
            : "No meaningful delivery blockers detected in the selected period.",
        action:
          overdue + blocked > 0
            ? "Review owners and next steps for the blocked queue first."
            : "Use the extra capacity to close older todo items or pull forward priority work.",
      },
      {
        tone: dueSoon > 0 || highPriorityOpen > 0 ? "warning" : "positive",
        label: "Focus",
        value: `${highPriorityOpen}`,
        text:
          highPriorityOpen > 0
            ? `${highPriorityOpen} high-priority tasks remain open, with ${dueSoon} due in the next 5 days.`
            : "No urgent concentration detected across current work.",
        action:
          highPriorityOpen > 0
            ? "Protect team focus by limiting new work until the highest-priority items move forward."
            : "Maintain flow and use planning time to rebalance project load.",
      },
    ];

    return {
      filteredTasks,
      total,
      completionRate,
      completionDelta,
      completedThisRange,
      blocked,
      overdue,
      dueSoon,
      createdThisRange,
      topProject,
      bottleneck,
      projectSnapshots,
      insights,
    };
  }, [projects, tasks, timeRange]);

  return (
    <section className="analytics-shell">
      <div className="analytics-header">
        <div className="analytics-header-copy">
          <span className="badge accent">Smart analytics</span>
          <h2 className="analytics-title">Turn delivery activity into signals you can act on</h2>
          <p className="analytics-subtitle">
            Review progress, identify risk, and spot which projects are helping or hurting execution.
          </p>
        </div>

        <div className="analytics-range-switch" role="tablist" aria-label="Analytics time filter">
          <button
            className={`analytics-range-btn${timeRange === 7 ? " analytics-range-btn--on" : ""}`}
            onClick={() => setTimeRange(7)}
            type="button"
            aria-pressed={timeRange === 7}
          >
            Last 7 days
          </button>
          <button
            className={`analytics-range-btn${timeRange === 30 ? " analytics-range-btn--on" : ""}`}
            onClick={() => setTimeRange(30)}
            type="button"
            aria-pressed={timeRange === 30}
          >
            Last 30 days
          </button>
        </div>
      </div>

      <div className="analytics-quick-stats">
        <div className="analytics-stat-card analytics-stat-card--accent">
          <span className="analytics-stat-label">Completion rate</span>
          <strong className="analytics-stat-value">{analytics.completionRate}%</strong>
          <span className="analytics-stat-note">{formatDelta(analytics.completionDelta)}</span>
        </div>
        <div className="analytics-stat-card">
          <span className="analytics-stat-label">Tasks completed</span>
          <strong className="analytics-stat-value">{analytics.completedThisRange}</strong>
          <span className="analytics-stat-note">Closed in the last {timeRange} days</span>
        </div>
        <div className="analytics-stat-card analytics-stat-card--warn">
          <span className="analytics-stat-label">Risks</span>
          <strong className="analytics-stat-value">{analytics.overdue + analytics.blocked}</strong>
          <span className="analytics-stat-note">
            {analytics.overdue} overdue · {analytics.blocked} blocked
          </span>
        </div>
      </div>

      <div className="analytics-insights-panel">
        <div className="analytics-insights-header">
          <h3 className="analytics-section-title">What stands out</h3>
          <p className="analytics-section-copy">A concise readout of trends, risks, and next-best actions.</p>
        </div>

        <div className="analytics-insights-grid">
          {analytics.insights.map((insight) => (
            <article key={insight.label} className={`analytics-insight-card analytics-insight-card--${insight.tone}`}>
              <div className="analytics-insight-top">
                <span className="analytics-insight-label">{insight.label}</span>
                <span className="analytics-insight-value">{insight.value}</span>
              </div>
              <p className="analytics-insight-text">{insight.text}</p>
              <p className="analytics-insight-action">{insight.action}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="analytics-charts-grid">
        <BarChart projects={analytics.projectSnapshots} />
        <DonutChart tasks={analytics.filteredTasks} completionRate={analytics.completionRate} />
      </div>

      <div className="analytics-secondary-grid">
        <section className="analytics-summary-card">
          <div className="analytics-summary-head">
            <h3 className="analytics-section-title">Decision support</h3>
            <p className="analytics-section-copy">Use these signals to plan the next move.</p>
          </div>

          <div className="analytics-summary-list">
            <div className="analytics-summary-item">
              <span className="analytics-summary-kicker">Top performing project</span>
              {analytics.topProject ? (
                <>
                  <strong className="analytics-summary-title">{analytics.topProject.name}</strong>
                  <p className="analytics-summary-text">
                    {analytics.topProject.completion}% complete with {analytics.topProject.done} completed tasks in this
                    period.
                  </p>
                </>
              ) : (
                <p className="analytics-summary-text">No standout project yet for the selected time window.</p>
              )}
            </div>

            <div className="analytics-summary-item">
              <span className="analytics-summary-kicker">Main bottleneck</span>
              {analytics.bottleneck && analytics.bottleneck.blocked + analytics.bottleneck.overdue > 0 ? (
                <>
                  <strong className="analytics-summary-title">{analytics.bottleneck.name}</strong>
                  <p className="analytics-summary-text">
                    {analytics.bottleneck.blocked} blocked and {analytics.bottleneck.overdue} overdue tasks need a closer
                    review.
                  </p>
                </>
              ) : (
                <p className="analytics-summary-text">No major project bottleneck is surfacing right now.</p>
              )}
            </div>
          </div>
        </section>

        <section className="analytics-summary-card analytics-summary-card--tinted">
          <div className="analytics-summary-head">
            <h3 className="analytics-section-title">Recommended focus</h3>
            <p className="analytics-section-copy">A simple plan to improve delivery quality.</p>
          </div>

          <div className="analytics-recommendation-list">
            <div className="analytics-recommendation-item">
              <span className="analytics-recommendation-title">Clear execution friction</span>
              <p className="analytics-summary-text">
                Resolve blocked work before adding new tasks so the active queue can keep moving.
              </p>
            </div>
            <div className="analytics-recommendation-item">
              <span className="analytics-recommendation-title">Protect near-term deadlines</span>
              <p className="analytics-summary-text">
                {analytics.dueSoon > 0
                  ? `${analytics.dueSoon} tasks are due soon. Reconfirm owners and completion plans this week.`
                  : "No immediate deadline crunch is visible in the current period."}
              </p>
            </div>
            <div className="analytics-recommendation-item">
              <span className="analytics-recommendation-title">Balance inflow and outflow</span>
              <p className="analytics-summary-text">
                {analytics.createdThisRange > analytics.completedThisRange
                  ? `Work intake is outpacing completion by ${analytics.createdThisRange - analytics.completedThisRange} tasks.`
                  : "Completion is keeping up with or exceeding new work entering the system."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
