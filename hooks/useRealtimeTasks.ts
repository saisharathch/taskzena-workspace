"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardTask } from "@/lib/services/dashboard";

type RealtimeStatus = "connecting" | "live" | "error" | "offline";

type UseRealtimeTasksOptions = {
  workspaceIds: string[];
  initialTasks: DashboardTask[];
};

export function useRealtimeTasks({ workspaceIds, initialTasks }: UseRealtimeTasksOptions) {
  const [tasks, setTasks]   = useState<DashboardTask[]>(initialTasks);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  // Sync whenever the server re-renders with fresh data (e.g. after router.refresh())
  // useState's initial value is frozen after first mount, so props changes must be
  // applied manually.
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?limit=50");
      const data = await res.json();
      if (data.success) setTasks(data.data as DashboardTask[]);
    } catch {
      // silently ignore; UI keeps showing stale data
    }
  }, []);

  useEffect(() => {
    if (!workspaceIds.length) { setStatus("offline"); return; }

    const supabase = createClient();
    const channel = supabase
      .channel("relay-tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Task" },
        () => { refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ActivityLog" },
        () => { refresh(); }
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED")  setStatus("live");
        if (s === "CLOSED")      setStatus("offline");
        if (s === "CHANNEL_ERROR") setStatus("error");
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [workspaceIds, refresh]);

  return { tasks, status };
}
