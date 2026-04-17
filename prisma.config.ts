import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { z } from "zod";

config(); // load .env before Prisma reads env vars

const prismaEnv = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
}).parse(process.env);

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: prismaEnv.DATABASE_URL,
  },
});
