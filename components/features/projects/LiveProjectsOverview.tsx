"use client";

import type { DashboardActivity, DashboardProject, DashboardStats, DashboardTask, DashboardWorkspace } from "@/lib/services/dashboard";
import { useLiveDashboardSummary } from "@/hooks/useLiveDashboardSummary";
import { ProjectDetailsGrid } from "@/components/features/projects/ProjectDetailsGrid";
import { ProjectPortfolioTable } from "@/components/features/projects/ProjectPortfolioTable";

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
      return "Live";
    case "connecting":
      return "Connecting...";
    case "error":
      return "Reconnecting...";
    default:
      return "Offline";
  }
}

export function LiveProjectsOverview({ initialData, workspaceIds }: Props) {
  const { data, status } = useLiveDashboardSummary({ workspaceIds, initialData });

  return (
    <>
      <div className="task-list-header-meta" style={{ marginBottom: "0.75rem" }}>
        <span className={`db-rt-badge db-rt-${status}`}>{statusLabel(status)}</span>
      </div>
      <ProjectPortfolioTable projects={data.projects} />
      <ProjectDetailsGrid projects={data.projects} />
    </>
  );
}
