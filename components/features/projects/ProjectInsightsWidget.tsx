"use client";

import { useState } from "react";
import type { ProjectInsight } from "@/lib/ai";
import { getApiErrorMessage } from "@/lib/client/api";

const RISK_META: Record<string, { label: string; cls: string; icon: string }> = {
  LOW:      { label: "Low risk",      cls: "db-insight-low",      icon: "✅" },
  MEDIUM:   { label: "Medium risk",   cls: "db-insight-medium",   icon: "⚠️" },
  HIGH:     { label: "High risk",     cls: "db-insight-high",     icon: "🔴" },
  CRITICAL: { label: "Critical risk", cls: "db-insight-critical", icon: "🚨" },
};

export function ProjectInsightsWidget() {
  const [state, setState] = useState<
    | { phase: "idle" }
    | { phase: "loading" }
    | { phase: "done"; insights: ProjectInsight }
    | { phase: "error"; message: string }
  >({ phase: "idle" });

  async function runAnalysis() {
    setState({ phase: "loading" });
    try {
      const res  = await fetch("/api/ai/insights", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(getApiErrorMessage(res, json, "Analysis failed."));
      setState({ phase: "done", insights: json.data.insights });
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  return (
    <section className="db-ai-panel">
      <div className="db-ai-header">
        <div>
          <span className="badge accent">AI · Project health</span>
          <h2 className="db-widget-title" style={{ marginTop: "0.35rem" }}>
            Project insights
          </h2>
          <p className="helper-text">
            AI analyses all your tasks and surfaces risks, workload imbalances, and actionable recommendations.
          </p>
        </div>
      </div>

      {state.phase === "idle" && (
        <button className="button full" onClick={runAnalysis} suppressHydrationWarning>
          ✦ Analyse project health
        </button>
      )}

      {state.phase === "loading" && (
        <div className="db-ai-loading">
          <div className="db-ai-spinner" />
          <p className="helper-text">Analysing your tasks…</p>
        </div>
      )}

      {state.phase === "error" && (
        <div className="notice error stack-sm">
          <p className="error">{state.message}</p>
          <button className="button secondary" onClick={() => setState({ phase: "idle" })} suppressHydrationWarning>
            Try again
          </button>
        </div>
      )}

      {state.phase === "done" && (() => {
        const { insights } = state;
        const meta = RISK_META[insights.riskLevel] ?? RISK_META.MEDIUM;
        return (
          <div className="db-insights-results stack-lg">
            {/* Risk banner */}
            <div className={`db-insight-banner ${meta.cls}`}>
              <span className="db-insight-icon">{meta.icon}</span>
              <div>
                <p className="db-insight-risk-label">{meta.label}</p>
                <p className="db-insight-summary">{insights.summary}</p>
              </div>
            </div>

            {/* Predicted outcome */}
            <div className="db-ai-block">
              <p className="overline">Predicted outcome</p>
              <p className="db-insight-outcome">{insights.predictedOutcome}</p>
            </div>

            <div className="db-insight-grid">
              {/* At-risk tasks */}
              {insights.atRiskTasks.length > 0 && (
                <div className="db-ai-block">
                  <p className="overline">At-risk tasks</p>
                  <ul className="db-ai-list">
                    {insights.atRiskTasks.map((t, i) => (
                      <li key={i}>🔴 {t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Workload warnings */}
              {insights.workloadWarnings.length > 0 && (
                <div className="db-ai-block">
                  <p className="overline">Workload alerts</p>
                  <ul className="db-ai-list">
                    {insights.workloadWarnings.map((w, i) => (
                      <li key={i}>⚠️ {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="db-ai-block">
              <p className="overline">Recommendations</p>
              <ol className="db-ai-subtasks">
                {insights.recommendations.map((r, i) => (
                  <li key={i} className="db-ai-subtask-item">
                    <span className="db-ai-subtask-num">{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              className="button secondary full"
              onClick={() => setState({ phase: "idle" })}
              suppressHydrationWarning
            >
              Refresh analysis
            </button>
          </div>
        );
      })()}
    </section>
  );
}
