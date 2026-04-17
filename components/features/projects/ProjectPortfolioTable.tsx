import type { DashboardProject } from "@/lib/services/dashboard";

type Props = { projects: DashboardProject[] };

// ── Helpers ───────────────────────────────────────────────────────────────────

const HEALTH_META = {
  "off-track": { label: "Off track", dot: "#ef4444", badge: "ppt-health-off",  icon: "●" },
  "at-risk":   { label: "At risk",   dot: "#f59e0b", badge: "ppt-health-risk", icon: "●" },
  "on-track":  { label: "On track",  dot: "#22c55e", badge: "ppt-health-on",   icon: "●" },
};

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "ppt-priority ppt-priority-urgent" },
  HIGH:   { label: "High",   cls: "ppt-priority ppt-priority-high"   },
  MEDIUM: { label: "Medium", cls: "ppt-priority ppt-priority-medium" },
  LOW:    { label: "Low",    cls: "ppt-priority ppt-priority-low"    },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectPortfolioTable({ projects }: Props) {
  const offTrack = projects.filter((p) => p.health === "off-track").length;
  const atRisk   = projects.filter((p) => p.health === "at-risk").length;
  const onTrack  = projects.filter((p) => p.health === "on-track").length;

  if (projects.length === 0) {
    return (
      <section className="ppt-shell">
        <div className="ppt-header">
          <div>
            <span className="badge accent">Portfolio</span>
            <h2 className="ppt-title">Project health overview</h2>
          </div>
        </div>
        <p className="table-empty" style={{ padding: "2rem 1.5rem" }}>
          No projects yet — create a project to see the portfolio view.
        </p>
      </section>
    );
  }

  return (
    <section className="ppt-shell">
      {/* ── Header ── */}
      <div className="ppt-header">
        <div>
          <span className="badge accent">Portfolio</span>
          <h2 className="ppt-title">Project health overview</h2>
        </div>

        {/* Status strip — like the Monday reference */}
        <div className="ppt-status-strip">
          <span className="ppt-status-chip ppt-chip-off">
            <span className="ppt-chip-dot" style={{ background: "#ef4444" }} />
            Off track <strong>{offTrack}</strong>
          </span>
          <span className="ppt-status-chip ppt-chip-risk">
            <span className="ppt-chip-dot" style={{ background: "#f59e0b" }} />
            At risk <strong>{atRisk}</strong>
          </span>
          <span className="ppt-status-chip ppt-chip-on">
            <span className="ppt-chip-dot" style={{ background: "#22c55e" }} />
            On track <strong>{onTrack}</strong>
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="ppt-table-wrap">
        <table className="ppt-table">
          <thead>
            <tr>
              <th className="ppt-col-project">Project</th>
              <th className="ppt-col-health">Health</th>
              <th className="ppt-col-progress">Progress</th>
              <th className="ppt-col-priority">Priority</th>
              <th className="ppt-col-tasks">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const health  = HEALTH_META[p.health];
              const pri     = PRIORITY_META[p.priority] ?? PRIORITY_META["MEDIUM"];
              const total   = p.total || 1; // avoid div/0

              // Progress bar segment widths (%)
              const wTodo   = Math.round((p.todo       / total) * 100);
              const wIP     = Math.round((p.inProgress / total) * 100);
              const wBlk    = Math.round((p.blocked    / total) * 100);
              const wDone   = Math.round((p.done       / total) * 100);

              return (
                <tr key={p.id} className="ppt-row">
                  {/* Project name + workspace */}
                  <td className="ppt-col-project">
                    <span className="ppt-project-name">{p.name}</span>
                    <span className="ppt-workspace-name">{p.workspaceName}</span>
                  </td>

                  {/* Health badge */}
                  <td className="ppt-col-health">
                    <span className={health.badge}>
                      <span className="ppt-health-dot" style={{ background: health.dot }} />
                      {health.label}
                    </span>
                  </td>

                  {/* Multi-segment progress bar */}
                  <td className="ppt-col-progress">
                    <div className="ppt-bar-wrap">
                      <div className="ppt-bar">
                        {wDone > 0 && (
                          <div className="ppt-seg ppt-seg-done" style={{ width: `${wDone}%` }} title={`Done: ${p.done}`} />
                        )}
                        {wIP > 0 && (
                          <div className="ppt-seg ppt-seg-ip" style={{ width: `${wIP}%` }} title={`In Progress: ${p.inProgress}`} />
                        )}
                        {wBlk > 0 && (
                          <div className="ppt-seg ppt-seg-blk" style={{ width: `${wBlk}%` }} title={`Blocked: ${p.blocked}`} />
                        )}
                        {wTodo > 0 && (
                          <div className="ppt-seg ppt-seg-todo" style={{ width: `${wTodo}%` }} title={`Todo: ${p.todo}`} />
                        )}
                      </div>
                      <span className="ppt-bar-pct">{p.total > 0 ? `${p.completion}%` : "—"}</span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="ppt-col-priority">
                    <span className={pri.cls}>{pri.label}</span>
                  </td>

                  {/* Task counts */}
                  <td className="ppt-col-tasks">
                    <span className="ppt-task-count">
                      {p.total > 0 ? (
                        <>
                          <span className="ppt-count-done">{p.done}</span>
                          <span className="ppt-count-sep">/</span>
                          <span className="ppt-count-total">{p.total}</span>
                        </>
                      ) : (
                        <span className="ppt-count-empty">No tasks</span>
                      )}
                    </span>
                    {p.overdue > 0 && (
                      <span className="ppt-overdue-flag">⏰ {p.overdue} overdue</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="ppt-legend">
        <span className="ppt-legend-item"><span className="ppt-legend-dot ppt-seg-done" />Done</span>
        <span className="ppt-legend-item"><span className="ppt-legend-dot ppt-seg-ip"   />In Progress</span>
        <span className="ppt-legend-item"><span className="ppt-legend-dot ppt-seg-blk"  />Blocked</span>
        <span className="ppt-legend-item"><span className="ppt-legend-dot ppt-seg-todo" />To Do</span>
      </div>
    </section>
  );
}
