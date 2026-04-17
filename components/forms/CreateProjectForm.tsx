"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type WorkspaceOption = {
  id: string;
  name: string;
};

export function CreateProjectForm({ workspaces, onSuccess }: { workspaces: WorkspaceOption[]; onSuccess?: () => void }) {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Keep the selected workspace in sync when the workspaces list changes
  // (e.g. after a new workspace is created and router.refresh() re-passes new props
  // but useState ignores the updated initial value — the effect corrects that)
  useEffect(() => {
    if (workspaces.length > 0 && !workspaces.find((w) => w.id === workspaceId)) {
      setWorkspaceId(workspaces[0].id);
    }
  }, [workspaces]);

  if (!workspaces.length) {
    return <div className="empty-state">Create a workspace first, then you can add projects inside it.</div>;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, name, description })
    });

    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Failed to create project.");
      setLoading(false);
      return;
    }

    setName("");
    setDescription("");
    router.refresh();
    setLoading(false);
    onSuccess?.();
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label className="field">
        <span className="field-label">Workspace</span>
        <select className="select" value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} required suppressHydrationWarning>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Project name</span>
        <input
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Q2 Delivery Revamp"
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
          placeholder="Capture goals, scope, and the outcome this project should drive."
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button className="button" type="submit" disabled={loading} suppressHydrationWarning>
        {loading ? "Creating project..." : "Create project"}
      </button>
    </form>
  );
}
