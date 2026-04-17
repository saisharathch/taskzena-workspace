"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getApiErrorMessage } from "@/lib/client/api";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function CreateWorkspaceForm({ onSuccess }: { onSuccess?: (workspaceName: string) => void } = {}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(toSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(toSlug(value));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug })
    });

    const result = await response.json();

    if (!response.ok) {
      setError(getApiErrorMessage(response, result, "Failed to create workspace."));
      setLoading(false);
      return;
    }

    const createdName = name;
    setName("");
    setSlug("");
    setSlugEdited(false);
    router.refresh();
    setLoading(false);
    onSuccess?.(createdName);
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label className="field">
        <span className="field-label">Workspace name</span>
        <input
          className="input"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="Product Operations"
          required
          suppressHydrationWarning
        />
      </label>

      <label className="field">
        <span className="field-label">Slug</span>
        <input
          className="input mono"
          value={slug}
          onChange={(event) => handleSlugChange(event.target.value)}
          placeholder="product-operations"
          required
          suppressHydrationWarning
        />
        <p className="field-note">Used in workspace URLs and routing.</p>
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button className="button" disabled={loading} type="submit" suppressHydrationWarning>
        {loading ? "Creating workspace..." : "Create workspace"}
      </button>
    </form>
  );
}
