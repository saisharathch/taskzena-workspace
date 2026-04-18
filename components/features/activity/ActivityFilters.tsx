"use client";

import type { ActivityActorOption, ActivityEventType } from "@/lib/activity";

type WorkspaceOption = {
  id: string;
  name: string;
};

type Props = {
  workspaces: WorkspaceOption[];
  workspaceId: string;
  eventType: ActivityEventType;
  actorId: string;
  dateFrom: string;
  dateTo: string;
  actorOptions: ActivityActorOption[];
  loading?: boolean;
  onWorkspaceChange: (workspaceId: string) => void;
  onEventTypeChange: (eventType: ActivityEventType) => void;
  onActorChange: (actorId: string) => void;
  onDateFromChange: (dateFrom: string) => void;
  onDateToChange: (dateTo: string) => void;
  onClear: () => void;
};

export function ActivityFilters({
  workspaces,
  workspaceId,
  eventType,
  actorId,
  dateFrom,
  dateTo,
  actorOptions,
  loading = false,
  onWorkspaceChange,
  onEventTypeChange,
  onActorChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: Props) {
  return (
    <section className="activity-filters">
      <label className="field">
        <span className="field-label">Workspace</span>
        <select
          className="select"
          value={workspaceId}
          onChange={(event) => onWorkspaceChange(event.target.value)}
          disabled={loading}
          suppressHydrationWarning
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Event type</span>
        <select
          className="select"
          value={eventType}
          onChange={(event) => onEventTypeChange(event.target.value as ActivityEventType)}
          disabled={loading}
          suppressHydrationWarning
        >
          <option value="all">All activity</option>
          <option value="task">Tasks</option>
          <option value="comment">Comments</option>
          <option value="project">Projects</option>
          <option value="member">Members</option>
          <option value="workspace">Workspace</option>
        </select>
      </label>

      <label className="field">
        <span className="field-label">Actor</span>
        <select
          className="select"
          value={actorId}
          onChange={(event) => onActorChange(event.target.value)}
          disabled={loading}
          suppressHydrationWarning
        >
          <option value="">All people</option>
          {actorOptions.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">From</span>
        <input
          className="input"
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          disabled={loading}
          suppressHydrationWarning
        />
      </label>

      <label className="field">
        <span className="field-label">To</span>
        <input
          className="input"
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          disabled={loading}
          suppressHydrationWarning
        />
      </label>

      <div className="activity-filters-actions">
        <button className="button secondary" type="button" onClick={onClear} disabled={loading}>
          Clear filters
        </button>
      </div>
    </section>
  );
}
