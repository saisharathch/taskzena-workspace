import type { DashboardStats } from "@/lib/services/dashboard";

type Props = { stats: DashboardStats };

type KpiCard = {
  id: string;
  icon: string;
  label: string;
  value: number | string;
  trend?: string;
  trendUp?: boolean | null;
  note: string;
  variant: "neutral" | "success" | "danger" | "warning" | "info";
};

function buildCards(stats: DashboardStats): KpiCard[] {
  return [
    {
      id: "projects",
      icon: "PR",
      label: "Total Projects",
      value: stats.projects,
      trend: `${stats.workspaces} workspace${stats.workspaces !== 1 ? "s" : ""}`,
      trendUp: null,
      note: "Active delivery scopes",
      variant: "neutral",
    },
    {
      id: "completed",
      icon: "OK",
      label: "Completed This Week",
      value: stats.completedThisWeek,
      trend: `${stats.completedTasks} total done`,
      trendUp: stats.completedThisWeek > 0 ? true : null,
      note: `${stats.completionRate}% overall completion rate`,
      variant: stats.completedThisWeek > 0 ? "success" : "neutral",
    },
    {
      id: "overdue",
      icon: "DL",
      label: "Overdue Tasks",
      value: stats.overdue,
      trend: stats.overdue > 0 ? "Needs attention" : "All on track",
      trendUp: stats.overdue > 0 ? false : true,
      note: stats.dueSoon > 0 ? `+${stats.dueSoon} due within 72 h` : "No upcoming deadlines",
      variant: stats.overdue > 0 ? "danger" : "success",
    },
    {
      id: "priority",
      icon: "HP",
      label: "High Priority",
      value: stats.urgent,
      trend: stats.urgent > 0 ? "Urgent + high priority" : "No urgent work",
      trendUp: stats.urgent > 0 ? false : null,
      note: `${stats.activeTasks} active task${stats.activeTasks !== 1 ? "s" : ""} in total`,
      variant: stats.urgent > 0 ? "warning" : "neutral",
    },
    {
      id: "team",
      icon: "TM",
      label: "Team Members",
      value: stats.teamMembers,
      trend: `${stats.workspaces} workspace${stats.workspaces !== 1 ? "s" : ""}`,
      trendUp: null,
      note: "Active collaborators",
      variant: "info",
    },
  ];
}

export function StatsGrid({ stats }: Props) {
  const cards = buildCards(stats);

  return (
    <section className="kpi-grid" aria-label="Key performance indicators">
      {cards.map((card) => (
        <article
          key={card.id}
          className={`kpi-card kpi-${card.variant}${card.id === "completed" && stats.completedThisWeek > 0 ? " kpi-primary" : ""}`}
        >
          <div className="kpi-top">
            <span className={`kpi-icon kpi-icon-${card.variant}`} aria-hidden="true">
              {card.icon}
            </span>
            <span className="kpi-label">{card.label}</span>
          </div>

          <p className="kpi-value">{card.value}</p>

          {card.trend && (
            <span
              className={`kpi-trend ${
                card.trendUp === true
                  ? "kpi-trend-up"
                  : card.trendUp === false
                    ? "kpi-trend-down"
                    : "kpi-trend-neutral"
              }`}
            >
              {card.trendUp === true && <span className="kpi-arrow">+</span>}
              {card.trendUp === false && <span className="kpi-arrow">-</span>}
              {card.trend}
            </span>
          )}

          <p className="kpi-note">{card.note}</p>
        </article>
      ))}
    </section>
  );
}
