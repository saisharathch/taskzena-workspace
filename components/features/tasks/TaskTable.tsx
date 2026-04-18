"use client";

import { useEffect, useMemo, useState } from "react";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { getApiErrorMessage } from "@/lib/client/api";
import type { DashboardTask } from "@/lib/services/dashboard";

type TaskListPayload = {
  data?: DashboardTask[];
  nextCursor?: string | null;
  error?: string;
  message?: string;
};

type Props = {
  tasks: DashboardTask[];
  workspaceIds: string[];
  initialNextCursor: string | null;
};

const STATUS_OPTIONS = ["All", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
const PRIORITY_OPTIONS = ["All", "URGENT", "HIGH", "MEDIUM", "LOW"] as const;

type SmartQuery = {
  textQuery: string;
  smartPriority: string | null;
  smartStatus: string | null;
  onlyOverdue: boolean;
  onlyUnassigned: boolean;
};

function parseSmartQuery(raw: string): SmartQuery {
  let text = raw;
  let smartPriority: string | null = null;
  let smartStatus: string | null = null;
  let onlyOverdue = false;
  let onlyUnassigned = false;

  const priorityMap: [RegExp, string][] = [
    [/\burgent\b/gi, "URGENT"],
    [/\bhigh[\s-]?priority\b/gi, "HIGH"],
    [/\bmedium[\s-]?priority\b/gi, "MEDIUM"],
    [/\blow[\s-]?priority\b/gi, "LOW"],
    [/\bhigh\b/gi, "HIGH"],
    [/\bmedium\b/gi, "MEDIUM"],
  ];

  for (const [pattern, value] of priorityMap) {
    if (pattern.test(text)) {
      smartPriority = value;
      text = text.replace(pattern, "").trim();
      break;
    }
  }

  const statusMap: [RegExp, string][] = [
    [/\bin[\s-]?progress\b/gi, "IN_PROGRESS"],
    [/\bblocked\b/gi, "BLOCKED"],
    [/\bcomplete[d]?\b/gi, "DONE"],
    [/\bdone\b/gi, "DONE"],
    [/\btodo\b/gi, "TODO"],
  ];

  for (const [pattern, value] of statusMap) {
    if (pattern.test(text)) {
      smartStatus = value;
      text = text.replace(pattern, "").trim();
      break;
    }
  }

  if (/\boverdue\b/gi.test(text)) {
    onlyOverdue = true;
    text = text.replace(/\boverdue\b/gi, "").trim();
  }

  if (/\bunassigned\b/gi.test(text)) {
    onlyUnassigned = true;
    text = text.replace(/\bunassigned\b/gi, "").trim();
  }

  return { textQuery: text.trim(), smartPriority, smartStatus, onlyOverdue, onlyUnassigned };
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "pill status-in-progress";
    case "BLOCKED":
      return "pill status-blocked";
    case "DONE":
      return "pill status-done";
    default:
      return "pill status-todo";
  }
}

function priorityClass(priority: string) {
  switch (priority) {
    case "LOW":
      return "pill priority-low";
    case "HIGH":
      return "pill priority-high";
    case "URGENT":
      return "pill priority-urgent";
    default:
      return "pill priority-medium";
  }
}

function isOverdue(task: DashboardTask) {
  return task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== "DONE";
}

function mergeTasks(...groups: DashboardTask[][]) {
  const seen = new Set<string>();
  const merged: DashboardTask[] = [];

  for (const group of groups) {
    for (const task of group) {
      if (seen.has(task.id)) continue;
      seen.add(task.id);
      merged.push(task);
    }
  }

  return merged.sort((left, right) => {
    const timeDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return right.id.localeCompare(left.id);
  });
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const STATUS_LABEL: Record<string, string> = {
  connecting: "Connecting...",
  live: "Live",
  error: "Reconnecting...",
  offline: "Offline",
};

export function TaskTable({ tasks: initialTasks, workspaceIds, initialNextCursor }: Props) {
  const { tasks, status: rtStatus } = useRealtimeTasks({ workspaceIds, initialTasks });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [priority, setPriority] = useState<string>("All");
  const [extraTasks, setExtraTasks] = useState<DashboardTask[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  useEffect(() => {
    setExtraTasks([]);
    setNextCursor(initialNextCursor);
    setLoadMoreError("");
  }, [initialTasks, initialNextCursor]);

  const mergedTasks = useMemo(() => mergeTasks(tasks, extraTasks), [tasks, extraTasks]);

  const filtered = useMemo(() => {
    const { textQuery, smartPriority, smartStatus, onlyOverdue, onlyUnassigned } = parseSmartQuery(search);
    const effectivePriority = smartPriority ?? (priority !== "All" ? priority : null);
    const effectiveStatus = smartStatus ?? (status !== "All" ? status : null);

    return mergedTasks.filter((task) => {
      if (effectivePriority && task.priority !== effectivePriority) return false;
      if (effectiveStatus && task.status !== effectiveStatus) return false;
      if (onlyOverdue && !isOverdue(task)) return false;
      if (onlyUnassigned && task.assignee !== null) return false;

      if (textQuery) {
        const query = textQuery.toLowerCase();
        const hit =
          task.title.toLowerCase().includes(query) ||
          task.project.name.toLowerCase().includes(query) ||
          task.project.workspace.name.toLowerCase().includes(query) ||
          (task.assignee?.fullName ?? "").toLowerCase().includes(query);

        if (!hit) return false;
      }

      return true;
    });
  }, [mergedTasks, status, priority, search]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    setLoadMoreError("");

    try {
      const params = new URLSearchParams({ limit: "50", cursor: nextCursor });
      const response = await fetch(`/api/tasks?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: TaskListPayload;
        error?: string;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        setLoadMoreError(getApiErrorMessage(response, payload, "We could not load more tasks right now."));
        return;
      }

      setExtraTasks((current) => mergeTasks(current, (payload.data?.data ?? []) as DashboardTask[]));
      setNextCursor(payload.data?.nextCursor ?? null);
    } catch {
      setLoadMoreError("We could not load more tasks right now.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="db-section task-list-shell">
      <div className="db-section-header task-list-header">
        <div className="task-list-title-block">
          <span className="badge">List View</span>
          <h2 className="section-title task-list-title">All tasks</h2>
          <p className="helper-text">Readable rows, calmer spacing, and faster scanning across projects.</p>
        </div>
        <div className="task-list-header-meta">
          <span className="task-list-count">{filtered.length} visible</span>
          <span className={`db-rt-badge db-rt-${rtStatus}`}>{STATUS_LABEL[rtStatus]}</span>
        </div>
      </div>

      <div className="db-filters task-list-filters">
        <input
          className="input db-search"
          type="search"
          placeholder="Search tasks, projects, assignees, or use terms like urgent, blocked, overdue"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          suppressHydrationWarning
        />

        <select
          className="select db-filter-select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          suppressHydrationWarning
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All statuses" : formatEnum(option)}
            </option>
          ))}
        </select>

        <select
          className="select db-filter-select"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          suppressHydrationWarning
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All priorities" : formatEnum(option)}
            </option>
          ))}
        </select>

        {(search || status !== "All" || priority !== "All") && (
          <button
            className="button secondary"
            onClick={() => {
              setSearch("");
              setStatus("All");
              setPriority("All");
            }}
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      <div className="table-wrap task-table-wrap">
        <table className="table task-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Due date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((task) => {
                const overdue = isOverdue(task);
                const description =
                  task.description && task.description.length > 96
                    ? `${task.description.slice(0, 96)}...`
                    : task.description;

                return (
                  <tr key={task.id} className={`task-table-row${overdue ? " db-row-overdue" : ""}`}>
                    <td>
                      <div className="task-table-main">
                        <strong>{task.title}</strong>
                        {description && <div className="table-subtitle task-table-description">{description}</div>}
                        {task.comments.length > 0 && (
                          <span className="db-comment-count">{task.comments.length} comments</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{task.project.name}</strong>
                      <div className="table-subtitle">{task.project.workspace.name}</div>
                    </td>
                    <td>
                      <span className={statusClass(task.status)}>{formatEnum(task.status)}</span>
                    </td>
                    <td>
                      <span className={priorityClass(task.priority)}>{formatEnum(task.priority)}</span>
                    </td>
                    <td>
                      {task.assignee?.fullName ?? task.assignee?.email ?? (
                        <span className="table-subtitle">Unassigned</span>
                      )}
                    </td>
                    <td className={overdue ? "db-overdue-date" : undefined}>
                      {task.dueDate ? (
                        dateFmt.format(new Date(task.dueDate))
                      ) : (
                        <span className="table-subtitle">No deadline</span>
                      )}
                      {overdue && <span className="db-overdue-tag">Overdue</span>}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="table-empty" colSpan={6}>
                  {mergedTasks.length === 0
                    ? "No tasks yet. Create your first task to populate this view."
                    : "No tasks match your current filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(nextCursor || loadMoreError) && (
        <div className="activity-pagination">
          <span className="activity-page-info">{filtered.length} loaded</span>
          {nextCursor ? (
            <button className="button secondary" onClick={loadMore} disabled={loadingMore} type="button">
              {loadingMore ? "Loading more..." : "Load more"}
            </button>
          ) : null}
          {loadMoreError ? <span className="notice error">{loadMoreError}</span> : null}
        </div>
      )}
    </section>
  );
}
