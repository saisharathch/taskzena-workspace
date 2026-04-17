"use client";

import { useState } from "react";
import { getApiErrorMessage } from "@/lib/client/api";

type TaskAiPanelProps = {
  title: string;
  description?: string | null;
};

export function TaskAiPanel({ title, description }: TaskAiPanelProps) {
  const [summary, setSummary] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"summary" | "subtasks" | null>(null);
  const payload = { taskTitle: title, taskDescription: description ?? "" };

  async function run(path: "/api/ai/summarize" | "/api/ai/subtasks") {
    setLoading(path === "/api/ai/summarize" ? "summary" : "subtasks");
    setError(null);

    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      setError(getApiErrorMessage(response, result, "The AI request could not be completed."));
      setLoading(null);
      return;
    }

    if (path === "/api/ai/summarize") {
      setSummary(result.data.summary);
    } else {
      setSubtasks(result.data.subtasks);
    }

    setLoading(null);
  }

  return (
    <section className="section-card surface-dark stack-lg">
      <div className="stack-sm">
        <span className="badge dark">AI assistant</span>
        <h2 className="section-title">Generate a clearer task brief</h2>
        <p className="subtitle">
          Use the latest task context to create a concise summary or an initial subtask breakdown for the team.
        </p>
      </div>

      <div className="button-row">
        <button className="button" onClick={() => run("/api/ai/summarize")} disabled={loading !== null} type="button">
          {loading === "summary" ? "Summarizing..." : "Summarize task"}
        </button>
        <button
          className="button secondary inverted"
          onClick={() => run("/api/ai/subtasks")}
          disabled={loading !== null}
          type="button"
        >
          {loading === "subtasks" ? "Generating..." : "Generate subtasks"}
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {summary ? (
        <div className="notice stack-sm">
          <strong>Summary</strong>
          <pre className="ai-output">{summary}</pre>
        </div>
      ) : null}

      {subtasks.length > 0 ? (
        <div className="notice stack-sm">
          <strong>Subtasks</strong>
          <ol className="db-ai-subtasks">
            {subtasks.map((subtask, index) => (
              <li key={index} className="db-ai-subtask-item">
                <span className="db-ai-subtask-num">{index + 1}</span>
                <span>{subtask}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
