"use client";

import type {
  DashboardActivity,
  DashboardProject,
  DashboardStats,
  DashboardTask,
  DashboardWorkspace,
} from "@/lib/services/dashboard";
import { StatsGrid } from "@/components/features/analytics/StatsGrid";
import { WeeklySummary } from "@/components/features/analytics/ActivityWeeklySummarySection";
import { SmartInsightsPanel } from "@/components/features/ai/SmartInsightsPanel";
import { useLiveDashboardSummary } from "@/hooks/useLiveDashboardSummary";

type Props = {
  initialData: {
    focusMessage: string;
    projects: DashboardProject[];
    recentActivity: DashboardActivity[];
    stats: DashboardStats;
    tasks: DashboardTask[];
    workspaces: DashboardWorkspace[];
  };
  workspaceIds: string[];
};

function statusLabel(status: string) {
  switch (status) {
    case "live":
      return "Live updates on";
    case "connecting":
      return "Connecting...";
    case "error":
      return "Reconnecting...";
    default:
      return "Offline";
  }
}

export function LiveDashboardOverview({ initialData, workspaceIds }: Props) {
  const { data, status } = useLiveDashboardSummary({ workspaceIds, initialData });

  return (
    <>
      <div className="task-list-header-meta" style={{ marginBottom: "0.75rem" }}>
        <span className={`db-rt-badge db-rt-${status}`}>{statusLabel(status)}</span>
      </div>
      <StatsGrid stats={data.stats} />
      <div className="dash-overview-grid">
        <SmartInsightsPanel tasks={data.tasks} stats={data.stats} workspaces={data.workspaces} />
        <WeeklySummary stats={data.stats} tasks={data.tasks} />
      </div>
    </>
  );
}
