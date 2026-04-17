import { z } from "zod";

export const aiInsightSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const aiInsightItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  severity: aiInsightSeveritySchema,
  message: z.string().trim().min(1).max(400),
});

export const aiTaskSummaryResponseSchema = z.object({
  summary: z.string().trim().min(1).max(1000),
});

export const aiSubtasksResponseSchema = z.object({
  subtasks: z.array(z.string().trim().min(1).max(200)).min(1).max(10),
});

export const taskAnalysisResponseSchema = z.object({
  refinedTitle: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(1000),
  subtasks: z.array(z.string().trim().min(1).max(200)).min(1).max(10),
  suggestedPriority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  possibleBlockers: z.array(z.string().trim().min(1).max(200)).max(10),
});

export const projectInsightResponseSchema = z.object({
  riskLevel: aiInsightSeveritySchema,
  summary: z.string().trim().min(1).max(300),
  atRiskTasks: z.array(z.string().trim().min(1).max(120)).max(20),
  workloadWarnings: z.array(z.string().trim().min(1).max(200)).max(20),
  recommendations: z.array(z.string().trim().min(1).max(200)).min(1).max(10),
  predictedOutcome: z.string().trim().min(1).max(200),
});

export const parsedTaskSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

export const parsedTasksResponseSchema = z.object({
  tasks: z.array(parsedTaskSchema).min(1).max(10),
});

export type TaskSummaryResponse = z.infer<typeof aiTaskSummaryResponseSchema>;
export type SubtasksResponse = z.infer<typeof aiSubtasksResponseSchema>;
export type TaskAnalysis = z.infer<typeof taskAnalysisResponseSchema>;
export type ProjectInsight = z.infer<typeof projectInsightResponseSchema>;
export type ParsedTask = z.infer<typeof parsedTaskSchema>;
export type ParsedTasksResponse = z.infer<typeof parsedTasksResponseSchema>;
