"use client";

import type { DashboardActivity } from "@/lib/services/dashboard";
import { ActivityTimeline } from "@/components/features/analytics/ActivityWeeklySummarySection";
import { useLiveActivity } from "@/hooks/useLiveActivity";

type Props = {
  initialActivity: DashboardActivity[];
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

export function LiveActivityTimeline({ initialActivity, workspaceIds }: Props) {
  const { activity, status } = useLiveActivity({
    workspaceIds,
    initialActivity,
  });

  return (
    <div className="stack-sm">
      <div className="task-list-header-meta">
        <span className={`db-rt-badge db-rt-${status}`}>{statusLabel(status)}</span>
      </div>
      <ActivityTimeline activity={activity} />
    </div>
  );
}
