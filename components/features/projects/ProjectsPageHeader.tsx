"use client";

import { useEffect, useState } from "react";
import { CreateWorkspaceForm } from "@/components/forms/CreateWorkspaceForm";
import { CreateProjectForm } from "@/components/forms/CreateProjectForm";

type WorkspaceOption = { id: string; name: string };
type Tab = "project" | "workspace";

export function ProjectsPageHeader({ workspaces }: { workspaces: WorkspaceOption[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("project");

  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  function open(t: Tab) {
    setTab(t);
    setModalOpen(true);
  }

  return (
    <>
      <div className="projects-ph">
        <div>
          <h1 className="projects-ph-title">Projects</h1>
          <p className="projects-ph-sub">
            Portfolio overview and delivery health across all workspaces.
          </p>
        </div>
        <div className="projects-ph-actions">
          <button
            className="projects-ph-btn projects-ph-btn--ghost"
            onClick={() => open("workspace")}
          >
            New workspace
          </button>
          <button className="projects-ph-btn" onClick={() => open("project")}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New project
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="em-backdrop"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="em-panel" onClick={(e) => e.stopPropagation()}>
            <div className="em-head">
              <div className="em-tabs">
                <button
                  className={`em-tab${tab === "project" ? " em-tab--on" : ""}`}
                  onClick={() => setTab("project")}
                >
                  New project
                </button>
                <button
                  className={`em-tab${tab === "workspace" ? " em-tab--on" : ""}`}
                  onClick={() => setTab("workspace")}
                >
                  New workspace
                </button>
              </div>
              <button
                className="em-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
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
              {tab === "project" ? (
                <>
                  <p className="em-desc">
                    Group related tasks under a clear delivery scope.
                  </p>
                  <CreateProjectForm
                    workspaces={workspaces}
                    onSuccess={() => setModalOpen(false)}
                  />
                </>
              ) : (
                <>
                  <p className="em-desc">
                    A durable container for projects and team activity.
                  </p>
                  <CreateWorkspaceForm onSuccess={() => setModalOpen(false)} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
