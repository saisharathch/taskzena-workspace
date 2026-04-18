"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type { DashboardActivity } from "@/lib/services/dashboard";
import { useWorkspaceRealtime } from "@/hooks/useWorkspaceRealtime";

type Options = {
  workspaceIds: string[];
  initialActivity: DashboardActivity[];
  limit?: number;
};

export function useLiveActivity({ workspaceIds, initialActivity, limit = 25 }: Options) {
  const [activity, setActivity] = useState<DashboardActivity[]>(initialActivity);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setActivity(initialActivity);
  }, [initialActivity]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/activity?limit=${limit}`, { cache: "no-store" });
      const payload = await response.json();

      if (payload.success) {
        startTransition(() => {
          setActivity((payload.data?.data ?? []) as DashboardActivity[]);
        });
      }
    } catch {
      // Keep the current activity list if a background refresh fails.
    }
  }, [limit]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

    refreshTimeoutRef.current = setTimeout(() => {
      refreshTimeoutRef.current = null;
      void refresh();
    }, 150);
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  const { status } = useWorkspaceRealtime({
    workspaceIds,
    channelName: "workspace-activity",
    subscriptions: [{ table: "ActivityLog" }],
    onEvent: scheduleRefresh,
  });

  return { activity, status, refresh };
}
