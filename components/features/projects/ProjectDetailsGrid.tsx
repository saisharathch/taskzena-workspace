import type { DashboardProject } from "@/lib/services/dashboard";

type Props = { projects: DashboardProject[] };

const HEALTH_COPY: Record<DashboardProject["health"], string> = {
  "on-track":  "Momentum looks healthy and delivery is staying on course.",
  "at-risk":   "This project needs a closer check on priorities and resourcing.",
  "off-track": "Blocked work or overdue tasks are threatening delivery pace.",
};

function CompletionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function ProjectDetailsGrid({ projects }: Props) {
  const featured = [...projects]
    .sort((a, b) => {
      const riskA = a.health === "off-track" ? 2 : a.health === "at-risk" ? 1 : 0;
      const riskB = b.health === "off-track" ? 2 : b.health === "at-risk" ? 1 : 0;
      if (riskA !== riskB) return riskB - riskA;
      return b.total - a.total;
    })
    .slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="project-detail-grid">
      {featured.map((project) => {
        const doneW  = project.total ? (project.done       / project.total) * 100 : 0;
        const ipW    = project.total ? (project.inProgress / project.total) * 100 : 0;
        const blkW   = project.total ? (project.blocked    / project.total) * 100 : 0;
        const todoW  = project.total ? (project.todo       / project.total) * 100 : 0;

        return (
          <article key={project.id} className="project-detail-card">
            {/* Header */}
            <div className="project-detail-head">
              <div className="stack-sm">
                <span className="badge accent">{project.workspaceName}</span>
                <div>
                  <h3 className="project-detail-title">{project.name}</h3>
                  <p className="project-detail-copy">{HEALTH_COPY[project.health]}</p>
                </div>
              </div>
              <span className={`project-health-pill project-health-${project.health}`}>
                {project.health.replace("-", " ")}
              </span>
            </div>

            {/* Metrics */}
            <div className="project-detail-metrics">
              <div className="project-detail-stat">
                <span className="pdm-stat-icon pdm-stat-icon--success">
                  <CompletionIcon />
                </span>
                <span className="project-detail-value">{project.completion}%</span>
                <span className="project-detail-label">Completion</span>
              </div>
              <div className="project-detail-stat">
                <span className="pdm-stat-icon pdm-stat-icon--info">
                  <TasksIcon />
                </span>
                <span className="project-detail-value">{project.total}</span>
                <span className="project-detail-label">Tasks tracked</span>
              </div>
              <div className="project-detail-stat">
                <span className={`pdm-stat-icon${project.overdue > 0 ? " pdm-stat-icon--danger" : " pdm-stat-icon--neutral"}`}>
                  <ClockIcon />
                </span>
                <span className="project-detail-value">{project.overdue}</span>
                <span className="project-detail-label">Overdue</span>
              </div>
            </div>

            {/* Progress */}
            <div className="project-detail-progress">
              <div className="project-detail-bar">
                <span className="project-detail-seg project-detail-done"      style={{ width: `${doneW}%` }} />
                <span className="project-detail-seg project-detail-progressing" style={{ width: `${ipW}%` }} />
                <span className="project-detail-seg project-detail-blocked"   style={{ width: `${blkW}%` }} />
                <span className="project-detail-seg project-detail-todo"      style={{ width: `${todoW}%` }} />
              </div>
              <div className="project-detail-meta">
                <span className="pdm-item pdm-done">{project.done} done</span>
                <span className="pdm-item pdm-ip">{project.inProgress} in progress</span>
                {project.blocked > 0 && (
                  <span className="pdm-item pdm-blk">{project.blocked} blocked</span>
                )}
                <span className="pdm-item pdm-todo">{project.todo} to do</span>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
