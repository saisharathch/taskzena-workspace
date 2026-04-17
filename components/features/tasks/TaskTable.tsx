"use client";

import { useMemo, useState } from "react";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import type { DashboardTask } from "@/lib/services/dashboard";

type Props = { tasks: DashboardTask[]; workspaceIds: string[] };

const STATUS_OPTIONS = ["All", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
const PRIORITY_OPTIONS = ["All", "URGENT", "HIGH", "MEDIUM", "LOW"] as const;
const PAGE_SIZE = 5;

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
  return task.dueDate && task.dueDate.getTime() < Date.now() && task.status !== "DONE";
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

export function TaskTable({ tasks: initialTasks, workspaceIds }: Props) {
  const { tasks, status: rtStatus } = useRealtimeTasks({ workspaceIds, initialTasks });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [priority, setPriority] = useState<string>("All");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const { textQuery, smartPriority, smartStatus, onlyOverdue, onlyUnassigned } = parseSmartQuery(search);
    const effectivePriority = smartPriority ?? (priority !== "All" ? priority : null);
    const effectiveStatus = smartStatus ?? (status !== "All" ? status : null);

    return tasks.filter((task) => {
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
  }, [tasks, status, priority, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageStart = page * PAGE_SIZE + 1;
  const pageEnd = Math.min(pageStart + PAGE_SIZE - 1, filtered.length);

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
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          suppressHydrationWarning
        />

        <select
          className="select db-filter-select"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(0);
          }}
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
          onChange={(event) => {
            setPriority(event.target.value);
            setPage(0);
          }}
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
              setPage(0);
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
              pageItems.map((task) => {
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
                        dateFmt.format(task.dueDate)
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
                  {tasks.length === 0
                    ? "No tasks yet. Create your first task to populate this view."
                    : "No tasks match your current filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="activity-pagination">
          <button
            className="activity-page-btn"
            onClick={() => setPage((currentPage) => currentPage - 1)}
            disabled={page === 0}
            aria-label="Previous page"
            suppressHydrationWarning
            type="button"
          >
            {"<"}
          </button>
          <span className="activity-page-info">
            {pageStart}-{pageEnd} of {filtered.length}
          </span>
          <button
            className="activity-page-btn"
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
            suppressHydrationWarning
            type="button"
          >
            {">"}
          </button>
        </div>
      )}
    </section>
  );
}
