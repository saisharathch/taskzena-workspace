"use client";

import { useEffect, useState } from "react";
import type { DashboardTask, MemberOption, ProjectOption } from "@/lib/services/dashboard";
import { CreateTaskForm } from "@/components/forms/CreateTaskForm";
import { NaturalLanguageTaskCreator } from "@/components/features/ai/NaturalLanguageTaskCreator";
import { TaskTable } from "@/components/features/tasks/TaskTable";
import { KanbanBoard } from "@/components/features/tasks/KanbanBoard";

type Tab = "board" | "list" | "ai";

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
  board: {
    title: "Execution Board",
    subtitle: "Move work across lanes, scan priority quickly, and keep delivery focused.",
  },
  list: {
    title: "Task List",
    subtitle: "Browse every task with cleaner spacing, faster scanning, and lighter filters.",
  },
  ai: {
    title: "AI Generator",
    subtitle: "Turn a rough brief into structured tasks in a single focused workspace.",
  },
};

type Props = {
  tasks: DashboardTask[];
  workspaceIds: string[];
  projects: ProjectOption[];
  membersByWorkspace: Record<string, MemberOption[]>;
};

export function TasksPageClient({ tasks, workspaceIds, projects, membersByWorkspace }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  useEffect(() => {
    if (!newTaskOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setNewTaskOpen(false);
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [newTaskOpen]);

  const meta = TAB_META[activeTab];

  return (
    <div className="dash-page exec-page">
      <div className="exec-shell">
        <header className="exec-header">
          <div className="exec-header-main">
            <div className="exec-header-copy">
              <span className="badge accent">Execution</span>
              <h1 className="exec-title">{meta.title}</h1>
              <p className="exec-subtitle">{meta.subtitle}</p>
            </div>

            <div className="exec-actions">
              {activeTab !== "ai" && (
                <button className="exec-btn-ghost" onClick={() => setActiveTab("ai")} type="button">
                  AI Generator
                </button>
              )}
              <button className="exec-btn-primary" onClick={() => setNewTaskOpen(true)} type="button">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Task
              </button>
            </div>
          </div>

          <nav className="exec-tabs" aria-label="Task workflow views">
            <button
              className={`exec-tab${activeTab === "board" ? " exec-tab--on" : ""}`}
              onClick={() => setActiveTab("board")}
              type="button"
              aria-pressed={activeTab === "board"}
            >
              Board
            </button>
            <button
              className={`exec-tab${activeTab === "list" ? " exec-tab--on" : ""}`}
              onClick={() => setActiveTab("list")}
              type="button"
              aria-pressed={activeTab === "list"}
            >
              List
            </button>
            <button
              className={`exec-tab${activeTab === "ai" ? " exec-tab--on" : ""}`}
              onClick={() => setActiveTab("ai")}
              type="button"
              aria-pressed={activeTab === "ai"}
            >
              AI Generator
            </button>
          </nav>
        </header>

        <section className="exec-panel">
          <div
            className="exec-panel-view"
            style={{ display: activeTab === "board" ? undefined : "none" }}
            aria-hidden={activeTab !== "board"}
          >
            <KanbanBoard initialTasks={tasks as Parameters<typeof KanbanBoard>[0]["initialTasks"]} />
          </div>

          <div
            className="exec-panel-view"
            style={{ display: activeTab === "list" ? undefined : "none" }}
            aria-hidden={activeTab !== "list"}
          >
            <TaskTable tasks={tasks} workspaceIds={workspaceIds} />
          </div>

          <div
            className="exec-panel-view"
            style={{ display: activeTab === "ai" ? undefined : "none" }}
            aria-hidden={activeTab !== "ai"}
          >
            <div className="exec-ai-layout">
              <div className="exec-ai-card">
                <div className="exec-ai-intro">
                  <span className="badge accent">AI Workflow</span>
                  <h2 className="exec-ai-title">Generate structured tasks from a simple brief</h2>
                  <p className="exec-ai-copy">
                    Keep AI creation separate from execution work so the page stays focused and easy to
                    scan.
                  </p>
                </div>
                <NaturalLanguageTaskCreator projects={projects} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {newTaskOpen && (
        <div
          className="em-backdrop"
          onClick={() => setNewTaskOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="em-panel em-panel--wide" onClick={(event) => event.stopPropagation()}>
            <div className="em-head">
              <span className="em-head-title">New task</span>
              <button className="em-close" onClick={() => setNewTaskOpen(false)} aria-label="Close">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="em-body">
              <CreateTaskForm
                projects={projects}
                membersByWorkspace={membersByWorkspace}
                onSuccess={() => setNewTaskOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
