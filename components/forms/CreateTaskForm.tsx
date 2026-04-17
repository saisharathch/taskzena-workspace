"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
type TaskPriority = (typeof TASK_PRIORITIES)[number];

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
type TaskStatus = (typeof TASK_STATUSES)[number];

type ProjectOption = {
  id: string;
  name: string;
  workspaceName: string;
  workspaceId: string;
};

type MemberOption = {
  id: string;
  fullName: string | null;
  email: string | null;
};

export function CreateTaskForm({
  projects,
  membersByWorkspace,
  onSuccess,
}: {
  projects: ProjectOption[];
  membersByWorkspace: Record<string, MemberOption[]>;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedProject = projects.find((p) => p.id === projectId);
  const availableMembers = selectedProject
    ? (membersByWorkspace[selectedProject.workspaceId] ?? [])
    : [];

  // Sync projectId when the projects list changes after a router.refresh()
  // (useState ignores updated initial values on re-renders)
  useEffect(() => {
    if (projects.length > 0 && !projects.find((p) => p.id === projectId)) {
      setProjectId(projects[0].id);
    }
  }, [projects]);

  if (!projects.length) {
    return <div className="empty-state">Create a project first, then tasks can be created inside that project.</div>;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title,
        description,
        priority,
        status,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null
      })
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Failed to create task.");
      setLoading(false);
      return;
    }

    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setStatus("TODO");
    setDueDate("");
    setAssigneeId("");
    router.refresh();
    setLoading(false);
    onSuccess?.();
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label className="field">
        <span className="field-label">Project</span>
        <select
          className="select"
          value={projectId}
          onChange={(event) => { setProjectId(event.target.value); setAssigneeId(""); }}
          required
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
        <span className="field-label">Task title</span>
        <input
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Publish onboarding checklist refresh"
          required
          suppressHydrationWarning
        />
      </label>

      <label className="field">
        <span className="field-label">Description</span>
        <textarea
          className="textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the outcome, dependencies, and why the task matters."
        />
      </label>

      <div className="grid grid-2">
        <label className="field">
          <span className="field-label">Priority</span>
          <select className="select" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} suppressHydrationWarning>
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Status</span>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)} suppressHydrationWarning>
            {TASK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-2">
        <label className="field">
          <span className="field-label">Due date</span>
          <input
            className="input"
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Assignee</span>
          <select
            className="select"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            suppressHydrationWarning
          >
            <option value="">Unassigned</option>
            {availableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName ?? m.email ?? m.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <button className="button" type="submit" disabled={loading} suppressHydrationWarning>
        {loading ? "Creating task..." : "Create task"}
      </button>
    </form>
  );
}
