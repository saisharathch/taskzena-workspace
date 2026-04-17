import { z } from "zod";

export const summarizeTaskSchema = z.object({
  taskTitle: z.string().trim().min(3).max(200),
  taskDescription: z.string().trim().max(5000).optional().or(z.literal(""))
});

export const generateSubtasksSchema = z.object({
  taskTitle: z.string().trim().min(3).max(200),
  taskDescription: z.string().trim().max(5000).optional().or(z.literal(""))
});

export const analyzeTaskRequestSchema = z.object({
  taskTitle: z.string().trim().min(1).max(200),
  taskDescription: z.string().trim().max(2000).optional(),
});

export const parseTasksRequestSchema = z.object({
  input: z.string().trim().min(5).max(500),
});
