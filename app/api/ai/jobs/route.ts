import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { analyzeTask } from "@/lib/ai";
import { enforceRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { z } from "zod";

const createSchema = z.object({
  taskId:    z.string().optional(),
  taskTitle: z.string().min(1).max(200),
  taskDesc:  z.string().max(2000).optional(),
});

/** POST — enqueue an AI job and immediately process it async */
export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const limitResponse = enforceRateLimit({
      request,
      route: "ai:jobs:create",
      rules: RateLimitPresets.ai,
      userId: user.id,
    });
    if (limitResponse) return limitResponse;

    const body = createSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError("Invalid payload.", 400, body.error.flatten());

    // Create job record as QUEUED
    const job = await prisma.aIJob.create({
      data: {
        userId:    user.id,
        taskId:    body.data.taskId ?? null,
        taskTitle: body.data.taskTitle,
        taskDesc:  body.data.taskDesc ?? null,
        status:    "QUEUED",
      },
    });

    // Fire-and-forget: process in background using waitUntil-style pattern
    processJob(job.id, body.data.taskTitle, body.data.taskDesc).catch(console.error);

    return jsonOk({ jobId: job.id, status: "QUEUED" }, { status: 202 });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to queue job.");
  }
}

/** GET — list recent AI jobs for current user */
export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const jobs = await prisma.aIJob.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, taskTitle: true, status: true, result: true, errorMsg: true, createdAt: true, updatedAt: true },
    });
    return jsonOk(jobs);
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to fetch jobs.");
  }
}

async function processJob(jobId: string, title: string, desc?: string) {
  await prisma.aIJob.update({ where: { id: jobId }, data: { status: "RUNNING" } });
  try {
    const result = await analyzeTask(title, desc);
    await prisma.aIJob.update({
      where: { id: jobId },
      data: { status: "DONE", result: result as object },
    });
  } catch (err) {
    await prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMsg: err instanceof Error ? err.message : "AI response could not be processed. Please try again.",
      },
    });
  }
}
