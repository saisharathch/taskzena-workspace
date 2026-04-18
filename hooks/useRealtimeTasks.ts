"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type { DashboardTask } from "@/lib/services/dashboard";
import { useWorkspaceRealtime } from "@/hooks/useWorkspaceRealtime";

type UseRealtimeTasksOptions = {
  workspaceIds: string[];
  initialTasks: DashboardTask[];
};

export function useRealtimeTasks({ workspaceIds, initialTasks }: UseRealtimeTasksOptions) {
  const [tasks, setTasks] = useState<DashboardTask[]>(initialTasks);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?limit=50");
      const data = await res.json();

      if (data.success) {
        startTransition(() => {
          setTasks((data.data?.data ?? []) as DashboardTask[]);
        });
      }
    } catch {
      // Keep showing the current list if a background refresh fails.
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

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
    channelName: "workspace-tasks",
    subscriptions: [
      { table: "ActivityLog" },
      { table: "Project" },
    ],
    onEvent: scheduleRefresh,
  });

  const updateTaskOptimistically = useCallback(
    (taskId: string, updater: (task: DashboardTask) => DashboardTask) => {
      let previousTask: DashboardTask | null = null;

      startTransition(() => {
        setTasks((currentTasks) =>
          currentTasks.map((task) => {
            if (task.id !== taskId) return task;
            previousTask = task;
            return updater(task);
          }),
        );
      });

      return () => {
        if (!previousTask) return;

        startTransition(() => {
          setTasks((currentTasks) =>
            currentTasks.map((task) => (task.id === taskId ? previousTask! : task)),
          );
        });
      };
    },
    [],
  );

  return { tasks, status, refresh, updateTaskOptimistically };
}
