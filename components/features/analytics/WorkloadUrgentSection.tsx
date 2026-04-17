"use client";

import Link from "next/link";
import type { DashboardTask } from "@/lib/services/dashboard";

function formatOverdue(due: Date): string {
  const ms = Date.now() - due.getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} overdue`;
  if (hours >= 1) return `${hours}h overdue`;
  return "Just overdue";
}

function formatDueSoon(due: Date): string {
  const ms = due.getTime() - Date.now();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor(ms / (1000 * 60));
  if (hours >= 23) return "Due tomorrow";
  if (hours >= 1) return `Due in ${hours}h`;
  if (mins > 0) return `Due in ${mins}m`;
  return "Due very soon";
}

type LoadLevel = "overloaded" | "normal" | "light";

function loadLevel(count: number): LoadLevel {
  if (count >= 7) return "overloaded";
  if (count >= 4) return "normal";
  return "light";
}

const LOAD_META: Record<LoadLevel, { label: string; color: string; bar: string; badge: string }> = {
  overloaded: { label: "Overloaded", color: "#ef4444", bar: "wl-bar-red", badge: "wl-badge wl-badge-red" },
  normal: { label: "Normal", color: "#f59e0b", bar: "wl-bar-amber", badge: "wl-badge wl-badge-amber" },
  light: { label: "Light", color: "#22c55e", bar: "wl-bar-green", badge: "wl-badge wl-badge-green" },
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function TeamWorkloadPanel({ tasks }: { tasks: DashboardTask[] }) {
  const map = new Map<string, { id: string; name: string; count: number }>();
  for (const task of tasks) {
    if (!task.assignee || task.status === "DONE") continue;
    const name = task.assignee.fullName ?? task.assignee.email ?? "Unknown";
    const existing = map.get(task.assignee.id);
    if (existing) existing.count += 1;
    else map.set(task.assignee.id, { id: task.assignee.id, name, count: 1 });
  }

  const members = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  const maxCount = Math.max(...members.map((member) => member.count), 1);
  const overloaded = members.filter((member) => member.count >= 7);
  const lightest = members.filter((member) => member.count < 4);
  const suggestion =
    overloaded.length > 0 && lightest.length > 0
      ? `Move 2 tasks from ${overloaded[0].name.split(" ")[0]} to ${lightest[lightest.length - 1].name.split(" ")[0]} to rebalance capacity.`
      : null;

  const unassigned = tasks.filter((task) => !task.assignee && task.status !== "DONE").length;
  const openTasks = tasks.filter((task) => task.status !== "DONE").length;

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div>
          <span className="badge accent">Team</span>
          <h3 className="panel-title">Workload distribution</h3>
        </div>
        <span className="panel-meta">{members.length} member{members.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="panel-body">
        {members.length === 0 ? (
          <div className="team-empty-card team-empty-card--compact">
            <h4 className="team-empty-title">No assigned work yet</h4>
            <p className="team-empty-copy">
              Assign tasks to teammates to unlock workload visibility and spot imbalances early.
            </p>
            <div className="team-empty-actions">
              <Link className="button secondary" href="/dashboard/tasks">
                Go to Tasks
              </Link>
              <Link className="button secondary" href="/dashboard/team?invite=1#team-management">
                Invite Teammate
              </Link>
            </div>
          </div>
        ) : (
          <div className="wl-list">
            {members.map((member) => {
              const level = loadLevel(member.count);
              const meta = LOAD_META[level];
              const pct = Math.round((member.count / maxCount) * 100);

              return (
                <div key={member.id} className="wl-row">
                  <div className="wl-avatar" style={{ background: `${meta.color}18`, color: meta.color }}>
                    {initials(member.name)}
                  </div>

                  <div className="wl-info">
                    <div className="wl-top">
                      <span className="wl-name">{member.name}</span>
                      <span className={meta.badge}>{meta.label}</span>
                    </div>
                    <div className="wl-bar-track">
                      <div className={`wl-bar-fill ${meta.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <span className="wl-count">{member.count}</span>
                </div>
              );
            })}
          </div>
        )}

        {openTasks > 0 && unassigned > 0 && (
          <div className="wl-unassigned">
            <span className="wl-unassigned-icon">!</span>
            <span>{unassigned} unassigned task{unassigned > 1 ? "s" : ""} are still waiting for an owner.</span>
          </div>
        )}

        {suggestion && (
          <div className="wl-suggestion">
            <span className="wl-suggestion-icon">i</span>
            <span>{suggestion}</span>
          </div>
        )}
      </div>
    </div>
  );
}

type UrgentTask = DashboardTask & { urgency: "overdue" | "today" | "soon" };

function UrgentTasksPanel({ tasks }: { tasks: DashboardTask[] }) {
  const now = Date.now();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const next24 = now + 24 * 60 * 60 * 1000;

  const urgent: UrgentTask[] = [];

  for (const task of tasks) {
    if (!task.dueDate || task.status === "DONE") continue;
    const due = task.dueDate.getTime();

    if (due < now) urgent.push({ ...task, urgency: "overdue" });
    else if (due <= todayEnd.getTime()) urgent.push({ ...task, urgency: "today" });
    else if (due <= next24) urgent.push({ ...task, urgency: "soon" });
  }

  urgent.sort((a, b) => {
    const order = { overdue: 0, today: 1, soon: 2 };
    if (order[a.urgency] !== order[b.urgency]) return order[a.urgency] - order[b.urgency];
    return a.dueDate!.getTime() - b.dueDate!.getTime();
  });

  const display = urgent.slice(0, 7);

  const URGENCY_META = {
    overdue: { icon: "!", label: "Overdue", cls: "ut-row ut-overdue", timeCls: "ut-time-red" },
    today: { icon: "~", label: "Due today", cls: "ut-row ut-today", timeCls: "ut-time-amber" },
    soon: { icon: "*", label: "Due soon", cls: "ut-row ut-soon", timeCls: "ut-time-yellow" },
  };

  const overdueCount = urgent.filter((task) => task.urgency === "overdue").length;
  const todayCount = urgent.filter((task) => task.urgency === "today").length;

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div>
          <span className="badge accent">Action</span>
          <h3 className="panel-title">Urgent and overdue tasks</h3>
        </div>
        <span className="panel-meta">{urgent.length} flagged</span>
      </div>

      {urgent.length > 0 && (
        <div className="ut-summary">
          {overdueCount > 0 && <span className="ut-chip ut-chip-red">{overdueCount} overdue</span>}
          {todayCount > 0 && <span className="ut-chip ut-chip-amber">{todayCount} due today</span>}
        </div>
      )}

      <div className="panel-body">
        {display.length === 0 ? (
          <div className="ut-all-clear">
            <span className="ut-clear-icon">OK</span>
            <span className="ut-clear-text">No urgent deadlines are slipping right now</span>
            <span className="ut-clear-sub">Use this time to assign owners and prepare the next batch of work.</span>
          </div>
        ) : (
          <div className="ut-list">
            {display.map((task) => {
              const meta = URGENCY_META[task.urgency];
              const timeLabel =
                task.urgency === "overdue" ? formatOverdue(task.dueDate!) : formatDueSoon(task.dueDate!);

              return (
                <div key={task.id} className={meta.cls}>
                  <span className="ut-icon" aria-hidden="true">
                    {meta.icon}
                  </span>
                  <div className="ut-content">
                    <span className="ut-task-title">{task.title}</span>
                    <span className="ut-project">{task.project.name}</span>
                  </div>
                  <div className="ut-right">
                    <span className={`ut-time ${meta.timeCls}`}>{timeLabel}</span>
                    {task.assignee && (
                      <span className="ut-assignee">
                        {task.assignee.fullName?.split(" ")[0] ?? task.assignee.email}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {urgent.length > 7 && (
              <p className="ut-overflow">
                +{urgent.length - 7} more task{urgent.length - 7 > 1 ? "s" : ""} need attention
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type Props = { tasks: DashboardTask[] };

export function WorkloadUrgentSection({ tasks }: Props) {
  return (
    <div className="wu-grid">
      <TeamWorkloadPanel tasks={tasks} />
      <UrgentTasksPanel tasks={tasks} />
    </div>
  );
}
