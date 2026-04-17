"use client";

import { useState } from "react";
import type { TaskAnalysis } from "@/lib/ai";

type Props = {
  tasks: Array<{ id: string; title: string; description: string | null }>;
};

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; analysis: TaskAnalysis; taskTitle: string }
  | { phase: "error"; message: string };

const PRIORITY_CLASS: Record<string, string> = {
  LOW:    "pill priority-low",
  MEDIUM: "pill priority-medium",
  HIGH:   "pill priority-high",
  URGENT: "pill priority-urgent",
};

export function AIInsightsPanel({ tasks }: Props) {
  const [selectedId, setSelectedId] = useState(tasks[0]?.id ?? "");
  const [state, setState] = useState<State>({ phase: "idle" });

  async function handleAnalyze() {
    const task = tasks.find((t) => t.id === selectedId);
    if (!task) return;

    setState({ phase: "loading" });

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Analysis failed.");
      }

      const json = await res.json();
      const analysis: TaskAnalysis = json.data?.analysis;
      if (!analysis?.refinedTitle) throw new Error("Unexpected response from AI service.");
      setState({ phase: "done", analysis, taskTitle: task.title });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  function handleReset() {
    setState({ phase: "idle" });
  }

  return (
    <section className="db-ai-panel">
      <div className="db-ai-header">
        <div>
          <span className="badge accent">AI assistant</span>
          <h2 className="db-widget-title" style={{ marginTop: "0.35rem" }}>
            Task intelligence
          </h2>
          <p className="helper-text">
            Select a task and let AI refine it — cleaner title, summary, subtasks, priority, and risk flags.
          </p>
        </div>
      </div>

      {/* ── Task selector + trigger ── */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          Create your first task to unlock AI analysis.
        </div>
      ) : (
        <div className="db-ai-controls">
          <select
            className="select"
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setState({ phase: "idle" }); }}
            disabled={state.phase === "loading"}
            suppressHydrationWarning
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          {state.phase !== "done" ? (
            <button
              className="button full"
              onClick={handleAnalyze}
              disabled={state.phase === "loading" || !selectedId}
              suppressHydrationWarning
            >
              {state.phase === "loading" ? "Analysing…" : "✦ Analyse with AI"}
            </button>
          ) : (
            <button className="button secondary full" onClick={handleReset}>
              Analyse another task
            </button>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {state.phase === "loading" && (
        <div className="db-ai-loading">
          <div className="db-ai-spinner" />
          <p className="helper-text">Generating insights…</p>
        </div>
      )}

      {/* ── Error ── */}
      {state.phase === "error" && (
        <div className="notice error">
          <strong>Analysis failed</strong>
          <p>{state.message}</p>
        </div>
      )}

      {/* ── Results ── */}
      {state.phase === "done" && (
        <div className="db-ai-results stack-lg">
          {/* Refined title */}
          <div className="db-ai-block">
            <p className="overline">Refined title</p>
            <p className="db-ai-refined-title">{state.analysis.refinedTitle}</p>
          </div>

          {/* Summary */}
          <div className="db-ai-block">
            <p className="overline">Summary</p>
            <div className="db-ai-summary">
              {state.analysis.summary.split("\n").map((line, i) => (
                <p key={i} className="db-ai-bullet">{line}</p>
              ))}
            </div>
          </div>

          {/* Priority + blockers row */}
          <div className="db-ai-meta-row">
            <div className="db-ai-block">
              <p className="overline">Suggested priority</p>
              <span className={PRIORITY_CLASS[state.analysis.suggestedPriority] ?? "pill"}>
                {state.analysis.suggestedPriority}
              </span>
            </div>
            <div className="db-ai-block">
              <p className="overline">Possible blockers</p>
              <ul className="db-ai-list">
                {state.analysis.possibleBlockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Subtasks */}
          <div className="db-ai-block">
            <p className="overline">Implementation subtasks</p>
            <ol className="db-ai-subtasks">
              {state.analysis.subtasks.map((s, i) => (
                <li key={i} className="db-ai-subtask-item">
                  <span className="db-ai-subtask-num">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
