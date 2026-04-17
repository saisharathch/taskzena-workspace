import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(3).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens.")
    .min(3)
    .max(50)
});
