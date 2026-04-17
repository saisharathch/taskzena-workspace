"use client";

import type { DragEvent } from "react";
import { useCallback, useState } from "react";

type KanbanTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: {
    id: string;
    name: string;
    workspace: { id: string; name: string };
  };
  assignee: { fullName: string | null; email: string | null } | null;
};

type Props = { initialTasks: KanbanTask[] };

const COLUMNS = [
  { key: "TODO", label: "To Do", color: "#94a3b8", bg: "kanban-col-bg-todo" },
  { key: "IN_PROGRESS", label: "In Progress", color: "#2563eb", bg: "kanban-col-bg-progress" },
  { key: "BLOCKED", label: "Blocked", color: "#dc2626", bg: "kanban-col-bg-blocked" },
  { key: "DONE", label: "Done", color: "#16a34a", bg: "kanban-col-bg-done" },
] as const;

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#c4956a",
  HIGH: "#b45309",
  URGENT: "#dc2626",
};

const AVATAR_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#059669",
  "#1d4ed8",
  "#b45309",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function isOverdue(task: KanbanTask) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
}

export function KanbanBoard({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterWs, setFilterWs] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const workspaces = [...new Map(tasks.map((task) => [task.project.workspace.id, task.project.workspace])).values()];

  const filtered = tasks.filter((task) => {
    if (filterWs !== "all" && task.project.workspace.id !== filterWs) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

  const onDragStart = useCallback((event: DragEvent, taskId: string) => {
    event.dataTransfer.setData("taskId", taskId);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(taskId);
  }, []);

  const onDragOver = useCallback((event: DragEvent, column: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOverColumn(column);
  }, []);

  const onDragLeave = useCallback(() => {
    setOverColumn(null);
  }, []);

  const onDrop = useCallback(
    async (event: DragEvent, targetStatus: string) => {
      event.preventDefault();
      setOverColumn(null);

      const taskId = event.dataTransfer.getData("taskId");
      if (!taskId) return;

      const task = tasks.find((item) => item.id === taskId);
      if (!task || task.status === targetStatus) {
        setDraggingId(null);
        return;
      }

      setTasks((previousTasks) =>
        previousTasks.map((item) => (item.id === taskId ? { ...item, status: targetStatus } : item)),
      );
      setDraggingId(null);
      setSaving(taskId);
      setError(null);

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error ?? "Failed to update task.");
        }
      } catch (err) {
        setTasks((previousTasks) =>
          previousTasks.map((item) => (item.id === taskId ? { ...item, status: task.status } : item)),
        );
        setError(err instanceof Error ? err.message : "Update failed.");
      } finally {
        setSaving(null);
      }
    },
    [tasks],
  );

  const onDragEnd = useCallback(() => {
    setDraggingId(null);
    setOverColumn(null);
  }, []);

  return (
    <div className="stack-xl">
      <section className="db-section kanban-shell">
        <div className="db-section-header kanban-toolbar">
          <div className="kanban-toolbar-copy">
            <span className="badge">Board View</span>
            <h2 className="section-title kanban-toolbar-title">Execution lanes</h2>
            <p className="helper-text">Keep work in motion with clearer columns and stronger task hierarchy.</p>
          </div>

          <div className="kanban-toolbar-meta">
            <span className="kanban-toolbar-count">{filtered.length} active tasks</span>
          </div>
        </div>

        <div className="db-filters kanban-filters">
          <select
            className="select db-filter-select"
            value={filterWs}
            onChange={(event) => setFilterWs(event.target.value)}
            suppressHydrationWarning
          >
            <option value="all">All workspaces</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
          <select
            className="select db-filter-select"
            value={filterPriority}
            onChange={(event) => setFilterPriority(event.target.value)}
            suppressHydrationWarning
          >
            <option value="all">All priorities</option>
            {["URGENT", "HIGH", "MEDIUM", "LOW"].map((priority) => (
              <option key={priority} value={priority}>
                {formatEnum(priority)}
              </option>
            ))}
          </select>
          {(filterWs !== "all" || filterPriority !== "all") && (
            <button
              className="button secondary"
              onClick={() => {
                setFilterWs("all");
                setFilterPriority("all");
              }}
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="notice error">
            <p className="error">{error}</p>
          </div>
        )}

        <div className="kanban-board">
          {COLUMNS.map((column) => {
            const columnTasks = filtered.filter((task) => task.status === column.key);
            const isOver = overColumn === column.key;

            return (
              <div
                key={column.key}
                className={`kanban-col ${column.bg}${isOver ? " kanban-col-over" : ""}`}
                onDragOver={(event) => onDragOver(event, column.key)}
                onDragLeave={onDragLeave}
                onDrop={(event) => onDrop(event, column.key)}
              >
                <div className="kanban-col-header">
                  <span className="kanban-col-dot" style={{ background: column.color }} />
                  <span className="kanban-col-label">{column.label}</span>
                  <span className="kanban-col-count">{columnTasks.length}</span>
                </div>

                <div className="kanban-cards">
                  {columnTasks.length === 0 && (
                    <div className={`kanban-empty${isOver ? " kanban-empty-over" : ""}`}>Drop a task here</div>
                  )}

                  {columnTasks.map((task) => {
                    const overdue = isOverdue(task);
                    const isDragging = draggingId === task.id;
                    const isSaving = saving === task.id;
                    const assigneeName = task.assignee?.fullName ?? task.assignee?.email ?? "Unassigned";
                    const description =
                      task.description && task.description.length > 88
                        ? `${task.description.slice(0, 88)}...`
                        : task.description;

                    return (
                      <article
                        key={task.id}
                        className={`kanban-card${isDragging ? " kanban-card-dragging" : ""}${overdue ? " kanban-card-overdue" : ""}${isSaving ? " kanban-card-saving" : ""}`}
                        draggable
                        onDragStart={(event) => onDragStart(event, task.id)}
                        onDragEnd={onDragEnd}
                      >
                        <div
                          className="kanban-card-priority-bar"
                          style={{ background: PRIORITY_COLOR[task.priority] ?? "#94a3b8" }}
                        />

                        <div className="kanban-card-body">
                          <div className="kanban-card-head">
                            <span className="kanban-card-project">{task.project.name}</span>
                            <span
                              className="kanban-card-priority"
                              style={{
                                background: `${PRIORITY_COLOR[task.priority] ?? "#94a3b8"}18`,
                                color: PRIORITY_COLOR[task.priority] ?? "#94a3b8",
                                borderColor: `${PRIORITY_COLOR[task.priority] ?? "#94a3b8"}33`,
                              }}
                            >
                              {formatEnum(task.priority)}
                            </span>
                          </div>

                          <p className="kanban-card-title">{task.title}</p>
                          {description && <p className="kanban-card-desc">{description}</p>}

                          <div className="kanban-card-meta">
                            <span className="kanban-card-meta-item">{task.project.workspace.name}</span>
                            {task.dueDate && (
                              <span className={`kanban-card-meta-item${overdue ? " kanban-card-meta-item-overdue" : ""}`}>
                                {overdue ? "Overdue " : "Due "}
                                {dateFmt.format(new Date(task.dueDate))}
                              </span>
                            )}
                          </div>

                          <div className="kanban-card-footer">
                            <div className="kanban-card-assignee">
                              {task.assignee ? (
                                <div
                                  className="kanban-avatar"
                                  style={{ background: getAvatarColor(assigneeName) }}
                                  title={assigneeName}
                                >
                                  {getInitials(assigneeName)}
                                </div>
                              ) : (
                                <div className="kanban-avatar kanban-avatar-unassigned" title="Unassigned">
                                  ?
                                </div>
                              )}
                              <span className="kanban-card-assignee-name">{assigneeName}</span>
                            </div>

                            {isSaving && <span className="kanban-saving-dot" aria-hidden="true" />}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
