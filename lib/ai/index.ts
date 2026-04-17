import OpenAI from "openai";

import { parseAndValidateAIResponse } from "@/lib/ai/parse";
import {
  aiSubtasksResponseSchema,
  aiTaskSummaryResponseSchema,
  parsedTasksResponseSchema,
  projectInsightResponseSchema,
  taskAnalysisResponseSchema,
  type ParsedTask,
  type ProjectInsight,
  type TaskAnalysis,
} from "@/lib/ai/schemas";
import { env } from "@/lib/env/server";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

type AITextResponse = { output_text?: string | null };

function getOutputText(response: AITextResponse, label: string) {
  const raw = response.output_text?.trim() ?? "";

  if (!raw) {
    console.error(`[ai:${label}] Empty AI response from model.`);
  }

  return raw;
}

export type { ParsedTask, ProjectInsight, TaskAnalysis };

export async function summarizeTask(title: string, description?: string): Promise<string> {
  const openai = getClient();
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `You are a task summarization assistant.
Return only valid JSON with exactly this shape:
{"summary":"- bullet 1\\n- bullet 2\\n- bullet 3"}
Rules:
- Output JSON only.
- Do not include markdown or code fences.
- Keep the summary concise and readable.

Title: ${title}
Description: ${description ?? "(none)"}`,
  });

  const parsed = parseAndValidateAIResponse(
    getOutputText(response, "summarize-task"),
    aiTaskSummaryResponseSchema,
    "summarize-task",
  );

  return parsed.summary;
}

export async function generateSubtasks(title: string, description?: string): Promise<string[]> {
  const openai = getClient();
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `You are a task planning assistant.
Return only valid JSON with exactly this shape:
{"subtasks":["subtask 1","subtask 2","subtask 3","subtask 4","subtask 5"]}
Rules:
- Output JSON only.
- Do not include markdown or code fences.
- Return implementation-ready subtasks.
- Keep each subtask under 200 characters.

Title: ${title}
Description: ${description ?? "(none)"}`,
  });

  const parsed = parseAndValidateAIResponse(
    getOutputText(response, "generate-subtasks"),
    aiSubtasksResponseSchema,
    "generate-subtasks",
  );

  return parsed.subtasks;
}

export async function analyzeTask(title: string, description?: string): Promise<TaskAnalysis> {
  const openai = getClient();

  const prompt = `You are a senior engineering project manager. Analyse the following task and return valid JSON with exactly these fields:
{
  "refinedTitle": "<improved, action-oriented title, max 80 chars>",
  "summary": "<3 concise bullet points separated by \\n>",
  "subtasks": ["<subtask 1>", "<subtask 2>", "<subtask 3>", "<subtask 4>", "<subtask 5>"],
  "suggestedPriority": "<one of: LOW | MEDIUM | HIGH | URGENT>",
  "possibleBlockers": ["<blocker 1>", "<blocker 2>", "<blocker 3>"]
}

Rules:
- Output JSON only.
- Do not include markdown or code fences.
- Do not include extra explanation text.

Task title: ${title}
Task description: ${description ?? "(none)"}`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  return parseAndValidateAIResponse(
    getOutputText(response, "analyze-task"),
    taskAnalysisResponseSchema,
    "analyze-task",
  );
}

export async function generateProjectInsights(tasks: {
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignee: string | null;
}[]): Promise<ProjectInsight> {
  const openai = getClient();

  const now = new Date();
  const overdueCount = tasks.filter((task) => task.dueDate && task.dueDate < now && task.status !== "DONE").length;
  const blockedCount = tasks.filter((task) => task.status === "BLOCKED").length;
  const urgentCount = tasks.filter((task) => task.priority === "URGENT" && task.status !== "DONE").length;
  const doneCount = tasks.filter((task) => task.status === "DONE").length;
  const totalCount = tasks.length;

  const taskList = tasks
    .slice(0, 40)
    .map((task) => `- "${task.title}" [${task.status}/${task.priority}${task.dueDate ? ` due:${task.dueDate.toISOString().slice(0, 10)}` : ""}${task.assignee ? ` @${task.assignee}` : ""}]`)
    .join("\n");

  const prompt = `You are a senior engineering project manager. Analyse these tasks and return valid JSON with exactly this shape:

Task summary: ${totalCount} total, ${doneCount} done, ${overdueCount} overdue, ${blockedCount} blocked, ${urgentCount} urgent.

Tasks:
${taskList}

{
  "riskLevel": "<LOW | MEDIUM | HIGH | CRITICAL>",
  "summary": "<1 sentence project health summary>",
  "atRiskTasks": ["<task title>", ...],
  "workloadWarnings": ["<warning>", ...],
  "recommendations": ["<action>", "<action>", "<action>"],
  "predictedOutcome": "<short prediction, e.g. 'On track' or 'At risk of missing deadline'>"
}

Rules:
- Output JSON only.
- Do not include markdown or code fences.
- Do not include extra explanation text.`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  return parseAndValidateAIResponse(
    getOutputText(response, "project-insights"),
    projectInsightResponseSchema,
    "project-insights",
  );
}

export async function parseNaturalLanguageTasks(input: string): Promise<ParsedTask[]> {
  const openai = getClient();

  const prompt = `You are a project planning assistant. Convert this natural language request into structured tasks.

User request: "${input}"

Return only valid JSON with exactly this shape:
{
  "tasks": [
    { "title": "<string, max 80 chars>", "description": "<string, max 200 chars>", "priority": "<LOW|MEDIUM|HIGH|URGENT>" }
  ]
}

Rules:
- Output JSON only.
- Do not include markdown or code fences.
- Do not include extra explanation text.
- Return at most 10 tasks.`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const parsed = parseAndValidateAIResponse(
    getOutputText(response, "parse-natural-language-tasks"),
    parsedTasksResponseSchema,
    "parse-natural-language-tasks",
  );

  return parsed.tasks;
}
