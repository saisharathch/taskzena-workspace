import { z } from "zod";

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal(""))
});
