"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/client/api";

type ParsedTask = {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
};

type Project = { id: string; name: string; workspaceName: string };

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#c4956a",
  HIGH: "#b45309",
  URGENT: "#dc2626",
};

export function NaturalLanguageTaskCreator({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [parsed, setParsed] = useState<ParsedTask[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"idle" | "parsing" | "preview" | "creating" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  async function handleParse() {
    if (!input.trim()) return;
    setPhase("parsing");
    setError(null);

    try {
      const response = await fetch("/api/ai/parse-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(getApiErrorMessage(response, json, "Parsing failed."));

      const tasks: ParsedTask[] = json.data.tasks;
      setParsed(tasks);
      setSelected(new Set(tasks.map((_, index) => index)));
      setPhase("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  async function handleCreate() {
    if (!projectId || selected.size === 0) return;
    setPhase("creating");
    setError(null);

    const tasksToCreate = parsed.filter((_, index) => selected.has(index));
    let created = 0;

    for (const task of tasksToCreate) {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: "TODO",
          }),
        });
        if (response.ok) {
          created += 1;
        } else {
          const result = await response.json().catch(() => null);
          if (response.status === 429) {
            throw new Error(getApiErrorMessage(response, result, "Too many requests. Please try again later."));
          }
        }
      } catch {
        setError("Task creation is being rate limited. Please wait a moment and try again.");
        setPhase("preview");
        return;
      }
    }

    setCreatedCount(created);
    setPhase("done");
    router.refresh();
  }

  function reset() {
    setInput("");
    setParsed([]);
    setSelected(new Set());
    setPhase("idle");
    setError(null);
  }

  function toggleSelect(index: number) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  if (projects.length === 0) {
    return <div className="empty-state">Create a project first to use AI task generation.</div>;
  }

  return (
    <section className="db-ai-panel exec-ai-generator">
      <div className="db-ai-header">
        <div>
          <span className="badge accent">AI Generator</span>
          <h2 className="db-widget-title" style={{ marginTop: "0.35rem" }}>
            Create tasks from text
          </h2>
          <p className="helper-text">
            Describe a deliverable, launch, or workflow and AI will break it into structured tasks.
          </p>
        </div>
      </div>

      {phase === "done" && (
        <div className="stack">
          <div className="notice strong stack-sm">
            <p className="section-title">
              {createdCount} task{createdCount !== 1 ? "s" : ""} created
            </p>
            <p className="subtitle">The new tasks have been added to the selected project and appear in the board.</p>
          </div>
          <button className="button secondary full" onClick={reset} suppressHydrationWarning type="button">
            Create more tasks
          </button>
        </div>
      )}

      {(phase === "idle" || phase === "parsing") && (
        <div className="stack">
          <label className="field">
            <span className="field-label">Project</span>
            <select
              className="select"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              suppressHydrationWarning
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.workspaceName} / {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">What needs to be done?</span>
            <textarea
              className="textarea exec-ai-textarea"
              rows={4}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder='Example: "Create tasks for launching our customer onboarding flow next week."'
              disabled={phase === "parsing"}
              suppressHydrationWarning
            />
          </label>

          {error && (
            <div className="notice error">
              <p className="error">{error}</p>
            </div>
          )}

          <button
            className="button full"
            onClick={handleParse}
            disabled={phase === "parsing" || !input.trim()}
            suppressHydrationWarning
            type="button"
          >
            {phase === "parsing" ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                <span className="db-ai-spinner" style={{ width: "14px", height: "14px" }} />
                Generating tasks...
              </span>
            ) : (
              "Generate tasks with AI"
            )}
          </button>
        </div>
      )}

      {(phase === "preview" || phase === "creating") && (
        <div className="stack">
          <div className="nl-task-list-header">
            <p className="helper-text">
              {parsed.length} task{parsed.length !== 1 ? "s" : ""} generated. Select which ones to create.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="text-link"
                style={{ fontSize: "0.8rem" }}
                onClick={() => setSelected(new Set(parsed.map((_, index) => index)))}
                type="button"
              >
                Select all
              </button>
              <span className="helper-text">/</span>
              <button
                className="text-link"
                style={{ fontSize: "0.8rem" }}
                onClick={() => setSelected(new Set())}
                type="button"
              >
                Deselect all
              </button>
            </div>
          </div>

          <div className="nl-task-list">
            {parsed.map((task, index) => (
              <label
                key={index}
                className={`nl-task-item${selected.has(index) ? " nl-task-item-selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(index)}
                  onChange={() => toggleSelect(index)}
                  className="nl-task-checkbox"
                  suppressHydrationWarning
                />
                <div className="nl-task-content">
                  <div className="nl-task-title-row">
                    <span className="nl-task-title">{task.title}</span>
                    <span
                      className="pill"
                      style={{
                        background: `${PRIORITY_COLORS[task.priority]}18`,
                        color: PRIORITY_COLORS[task.priority],
                        border: `1px solid ${PRIORITY_COLORS[task.priority]}33`,
                        fontSize: "0.7rem",
                        padding: "0.1rem 0.45rem",
                        flexShrink: 0,
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                  {task.description && <p className="nl-task-desc">{task.description}</p>}
                </div>
              </label>
            ))}
          </div>

          {error && (
            <div className="notice error">
              <p className="error">{error}</p>
            </div>
          )}

          <div className="exec-ai-actions">
            <button
              className="button full"
              onClick={handleCreate}
              disabled={selected.size === 0 || phase === "creating"}
              suppressHydrationWarning
              type="button"
            >
              {phase === "creating"
                ? "Creating..."
                : `Create ${selected.size} task${selected.size !== 1 ? "s" : ""}`}
            </button>
            <button className="button secondary" onClick={reset} suppressHydrationWarning type="button">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
