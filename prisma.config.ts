import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config(); // load .env before Prisma reads env vars

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
