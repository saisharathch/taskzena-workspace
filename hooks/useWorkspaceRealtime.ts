"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type RealtimeStatus = "connecting" | "live" | "error" | "offline";

type RealtimeEvent = "*" | "INSERT" | "UPDATE" | "DELETE";

type WorkspaceSubscription = {
  table: string;
  event?: RealtimeEvent;
  filterField?: string;
  workspaceScoped?: boolean;
};

type Options = {
  workspaceIds: string[];
  subscriptions: WorkspaceSubscription[];
  onEvent: () => void;
  channelName: string;
};

export function useWorkspaceRealtime({
  workspaceIds,
  subscriptions,
  onEvent,
  channelName,
}: Options) {
  const [status, setStatus] = useState<RealtimeStatus>("offline");
  const onEventRef = useRef(onEvent);
  const instanceId = useId().replace(/[:]/g, "");
  const workspaceKey = workspaceIds.join(",");
  const scopedWorkspaceIds = useMemo(
    () => (workspaceKey ? workspaceKey.split(",").filter(Boolean) : []),
    [workspaceKey],
  );
  const subscriptionsKey = subscriptions
    .map((subscription) =>
      [
        subscription.table,
        subscription.event ?? "*",
        subscription.filterField ?? "workspaceId",
        subscription.workspaceScoped === false ? "global" : "workspace",
      ].join(":"),
    )
    .join("|");

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const activeSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (subscription) => subscription.workspaceScoped === false || scopedWorkspaceIds.length > 0,
      ),
    [scopedWorkspaceIds.length, subscriptionsKey],
  );

  useEffect(() => {
    if (!activeSubscriptions.length) {
      setStatus("offline");
      return;
    }

    setStatus("connecting");

    const supabase = createClient();
    let channel = supabase.channel(`${channelName}:${workspaceKey || "global"}:${instanceId}`);

    for (const subscription of activeSubscriptions) {
      const filterField = subscription.filterField ?? "workspaceId";
      const filters =
        subscription.workspaceScoped === false
          ? [null]
          : scopedWorkspaceIds.map((workspaceId) => `${filterField}=eq.${workspaceId}`);

      for (const filter of filters) {
        channel = channel.on(
          "postgres_changes",
          {
            event: subscription.event ?? "*",
            schema: "public",
            table: subscription.table,
            ...(filter ? { filter } : {}),
          },
          () => {
            onEventRef.current();
          },
        );
      }
    }

    channel.subscribe((nextStatus) => {
      if (nextStatus === "SUBSCRIBED") setStatus("live");
      if (nextStatus === "CLOSED") setStatus("offline");
      if (nextStatus === "CHANNEL_ERROR") setStatus("error");
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSubscriptions, channelName, instanceId, scopedWorkspaceIds, workspaceKey]);

  return { status };
}
