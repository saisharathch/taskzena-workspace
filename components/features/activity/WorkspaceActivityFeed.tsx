"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ActivityActorOption, ActivityEventType, ActivityFeedItem } from "@/lib/activity";
import { useWorkspaceRealtime } from "@/hooks/useWorkspaceRealtime";
import { getApiErrorMessage } from "@/lib/client/api";
import { ActivityFeed } from "@/components/features/activity/ActivityFeed";
import { ActivityFilters } from "@/components/features/activity/ActivityFilters";

type WorkspaceOption = {
  id: string;
  name: string;
};

type Props = {
  workspaces: WorkspaceOption[];
  initialWorkspaceId: string;
  initialItems: ActivityFeedItem[];
  initialNextCursor: string | null;
  initialActors: ActivityActorOption[];
  initialEventType?: ActivityEventType;
  initialActorId?: string;
  initialDateFrom?: string;
  initialDateTo?: string;
};

export function WorkspaceActivityFeed({
  workspaces,
  initialWorkspaceId,
  initialItems,
  initialNextCursor,
  initialActors,
  initialEventType = "all",
  initialActorId = "",
  initialDateFrom = "",
  initialDateTo = "",
}: Props) {
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [eventType, setEventType] = useState<ActivityEventType>(initialEventType);
  const [actorId, setActorId] = useState(initialActorId);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [items, setItems] = useState<ActivityFeedItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [actors, setActors] = useState<ActivityActorOption[]>(initialActors);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const didMountRef = useRef(false);

  const currentWorkspaceIds = useMemo(() => (workspaceId ? [workspaceId] : []), [workspaceId]);

  const fetchActivity = useCallback(
    async (options?: { append?: boolean; cursor?: string | null; workspaceId?: string }) => {
      const append = options?.append ?? false;
      const cursor = options?.cursor ?? null;
      const activeWorkspaceId = options?.workspaceId ?? workspaceId;

      if (!activeWorkspaceId) return;

      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError("");
      }

      try {
        const params = new URLSearchParams({
          workspaceId: activeWorkspaceId,
          limit: "20",
          format: "feed",
        });
        if (cursor) params.set("cursor", cursor);
        if (eventType !== "all") params.set("eventType", eventType);
        if (actorId) params.set("actorId", actorId);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        const response = await fetch(`/api/activity?${params.toString()}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          setError(getApiErrorMessage(response, payload, "We could not load activity right now."));
          return;
        }

        const nextItems = (payload.data?.data ?? []) as ActivityFeedItem[];

        setItems((current) => {
          if (!append) return nextItems;

          const seen = new Set(current.map((item) => item.id));
          return [...current, ...nextItems.filter((item) => !seen.has(item.id))];
        });
        setNextCursor(payload.data?.nextCursor ?? null);
        setActors((payload.data?.filters?.actors ?? []) as ActivityActorOption[]);
      } catch {
        setError("We could not load activity right now.");
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [actorId, dateFrom, dateTo, eventType, workspaceId],
  );

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    void fetchActivity();
  }, [fetchActivity]);

  const { status } = useWorkspaceRealtime({
    workspaceIds: currentWorkspaceIds,
    channelName: "workspace-activity-feed",
    subscriptions: [{ table: "ActivityLog" }],
    onEvent: () => {
      void fetchActivity();
    },
  });

  const liveStatus =
    currentWorkspaceIds.length === 0
      ? "No workspace selected"
      : status === "live"
        ? "Live updates on"
        : status === "connecting"
          ? "Connecting..."
          : status === "error"
            ? "Reconnecting..."
            : "Offline";

  return (
    <div className="stack-lg">
      <section className="activity-hero-card">
        <div>
          <span className="badge accent">Audit timeline</span>
          <h2 className="section-title">Track everything that changed in one place</h2>
          <p className="helper-text">
            Follow task movement, member changes, project creation, and workspace activity without hunting through the app.
          </p>
        </div>
        <div className="task-list-header-meta">
          <span className={`db-rt-badge db-rt-${status}`}>{liveStatus}</span>
        </div>
      </section>

      <ActivityFilters
        workspaces={workspaces}
        workspaceId={workspaceId}
        eventType={eventType}
        actorId={actorId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        actorOptions={actors}
        loading={loading}
        onWorkspaceChange={(nextWorkspaceId) => {
          setWorkspaceId(nextWorkspaceId);
          setActorId("");
          setNextCursor(null);
        }}
        onEventTypeChange={setEventType}
        onActorChange={setActorId}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={() => {
          setEventType("all");
          setActorId("");
          setDateFrom("");
          setDateTo("");
        }}
      />

      <ActivityFeed
        items={items}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={Boolean(nextCursor)}
        onRetry={() => fetchActivity()}
        onLoadMore={() => fetchActivity({ append: true, cursor: nextCursor })}
      />
    </div>
  );
}
