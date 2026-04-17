import OpenAI from "openai";

import { env } from "@/lib/env/server";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type ProjectInsight = {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;            // 1-sentence overview
  atRiskTasks: string[];      // task titles that are at risk
  workloadWarnings: string[]; // e.g. "User X has 8 open tasks"
  recommendations: string[];  // actionable steps
  predictedOutcome: string;   // e.g. "Project on track" or "Likely to miss deadline"
};

export type TaskAnalysis = {
  refinedTitle: string;
  summary: string;
  subtasks: string[];
  suggestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  possibleBlockers: string[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeJson<T>(raw: string, fallback: T): T {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

export async function summarizeTask(title: string, description?: string): Promise<string> {
  const openai = getClient();
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `Summarize this task in 3 concise bullet points (start each with •).\nTitle: ${title}\nDescription: ${description ?? "(none)"}`,
  });
  return response.output_text.trim();
}

export async function generateSubtasks(title: string, description?: string): Promise<string> {
  const openai = getClient();
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `Break this task into 5 implementation-ready subtasks. Return a JSON array of strings only, no markdown.\nTitle: ${title}\nDescription: ${description ?? "(none)"}`,
  });
  return response.output_text.trim();
}

/**
 * Full AI workflow: given a rough task description, returns a refined title,
 * 3-bullet summary, 5 subtasks, a priority suggestion, and potential blockers.
 */
export async function analyzeTask(
  title: string,
  description?: string
): Promise<TaskAnalysis> {
  const openai = getClient();

  const prompt = `You are a senior engineering project manager. Analyse the following task and return a JSON object with exactly these fields:
{
  "refinedTitle": "<improved, action-oriented title, max 80 chars>",
  "summary": "<3 concise bullet points starting with •, separated by \\n>",
  "subtasks": ["<subtask 1>", "<subtask 2>", "<subtask 3>", "<subtask 4>", "<subtask 5>"],
  "suggestedPriority": "<one of: LOW | MEDIUM | HIGH | URGENT>",
  "possibleBlockers": ["<blocker 1>", "<blocker 2>", "<blocker 3>"]
}

Return only the raw JSON, no markdown, no explanation.

Task title: ${title}
Task description: ${description ?? "(none)"}`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const fallback: TaskAnalysis = {
    refinedTitle: title,
    summary: "• Unable to generate summary at this time.",
    subtasks: ["Break down the task manually."],
    suggestedPriority: "MEDIUM",
    possibleBlockers: ["AI analysis unavailable."],
  };

  return safeJson<TaskAnalysis>(response.output_text, fallback);
}

/**
 * Analyse an entire project's task list and return risk signals,
 * workload distribution warnings, and actionable recommendations.
 */
export async function generateProjectInsights(tasks: {
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignee: string | null;
}[]): Promise<ProjectInsight> {
  const openai = getClient();

  const now        = new Date();
  const overdueCount  = tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== "DONE").length;
  const blockedCount  = tasks.filter((t) => t.status === "BLOCKED").length;
  const urgentCount   = tasks.filter((t) => t.priority === "URGENT" && t.status !== "DONE").length;
  const doneCount     = tasks.filter((t) => t.status === "DONE").length;
  const totalCount    = tasks.length;

  const taskList = tasks
    .slice(0, 40)
    .map((t) => `- "${t.title}" [${t.status}/${t.priority}${t.dueDate ? ` due:${t.dueDate.toISOString().slice(0, 10)}` : ""}${t.assignee ? ` @${t.assignee}` : ""}]`)
    .join("\n");

  const prompt = `You are a senior engineering project manager. Analyse these tasks and return a JSON object:

Task summary: ${totalCount} total, ${doneCount} done, ${overdueCount} overdue, ${blockedCount} blocked, ${urgentCount} urgent.

Tasks:
${taskList}

Return exactly this JSON (no markdown, no explanation):
{
  "riskLevel": "<LOW | MEDIUM | HIGH | CRITICAL>",
  "summary": "<1 sentence project health summary>",
  "atRiskTasks": ["<task title>", ...],
  "workloadWarnings": ["<warning>", ...],
  "recommendations": ["<action>", "<action>", "<action>"],
  "predictedOutcome": "<short prediction, e.g. 'On track' or 'At risk of missing Q2 deadline'>"
}`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const fallback: ProjectInsight = {
    riskLevel: overdueCount > 0 ? "HIGH" : blockedCount > 0 ? "MEDIUM" : "LOW",
    summary: `${totalCount} tasks tracked. ${overdueCount} overdue, ${blockedCount} blocked.`,
    atRiskTasks: [],
    workloadWarnings: [],
    recommendations: ["Review overdue tasks.", "Unblock blocked tasks.", "Reassign if needed."],
    predictedOutcome: overdueCount > 0 ? "At risk of delay." : "On track.",
  };

  return safeJson<ProjectInsight>(response.output_text, fallback);
}

/**
 * Parse a natural language prompt into one or more structured task definitions.
 * e.g. "Create 5 tasks for launching a website" → [{title, description, priority}, ...]
 */
export async function parseNaturalLanguageTasks(input: string): Promise<
  Array<{ title: string; description: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }>
> {
  const openai = getClient();

  const prompt = `You are a project planning assistant. Convert this natural language request into structured tasks.

User request: "${input}"

Return a JSON array (max 10 tasks). Each item must have exactly:
{ "title": "<string, max 80 chars>", "description": "<string, max 200 chars>", "priority": "<LOW|MEDIUM|HIGH|URGENT>" }

Return only the raw JSON array, no markdown, no explanation.`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  type ParsedTask = { title: string; description: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" };
  const fallback: ParsedTask[] = [
    { title: input.slice(0, 80), description: "", priority: "MEDIUM" },
  ];

  const parsed = safeJson<ParsedTask[]>(response.output_text, fallback);
  return Array.isArray(parsed) ? parsed.slice(0, 10) : fallback;
}
