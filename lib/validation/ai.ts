import { z } from "zod";

export const summarizeTaskSchema = z.object({
  taskTitle: z.string().trim().min(3).max(200),
  taskDescription: z.string().trim().max(5000).optional().or(z.literal(""))
});

export const generateSubtasksSchema = z.object({
  taskTitle: z.string().trim().min(3).max(200),
  taskDescription: z.string().trim().max(5000).optional().or(z.literal(""))
});
