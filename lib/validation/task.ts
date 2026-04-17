import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable()
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  projectId: z.string().min(1).optional(),
  title: z.string().trim().min(3).max(200).optional()
});
