"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type {
  DashboardActivity,
  DashboardProject,
  DashboardStats,
  DashboardTask,
  DashboardWorkspace,
} from "@/lib/services/dashboard";
import { useWorkspaceRealtime } from "@/hooks/useWorkspaceRealtime";

type DashboardLivePayload = {
  focusMessage: string;
  projects: DashboardProject[];
  recentActivity: DashboardActivity[];
  stats: DashboardStats;
  tasks: DashboardTask[];
  workspaces: DashboardWorkspace[];
};

type Options = {
  workspaceIds: string[];
  initialData: DashboardLivePayload;
};

export function useLiveDashboardSummary({ workspaceIds, initialData }: Options) {
  const [data, setData] = useState<DashboardLivePayload>(initialData);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/live", { cache: "no-store" });
      const payload = await response.json();

      if (payload.success) {
        startTransition(() => {
          setData(payload.data as DashboardLivePayload);
        });
      }
    } catch {
      // Keep the current dashboard summary if a background refresh fails.
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

    refreshTimeoutRef.current = setTimeout(() => {
      refreshTimeoutRef.current = null;
      void refresh();
    }, 200);
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  const { status } = useWorkspaceRealtime({
    workspaceIds,
    channelName: "workspace-dashboard",
    subscriptions: [
      { table: "ActivityLog" },
      { table: "WorkspaceMember" },
      { table: "WorkspaceInvite" },
    ],
    onEvent: scheduleRefresh,
  });

  return { data, status, refresh };
}
