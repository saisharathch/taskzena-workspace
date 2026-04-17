import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";

/** GET /api/ai/jobs/[jobId] — poll job status */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { jobId } = await params;

    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
      select: { id: true, userId: true, taskTitle: true, status: true, result: true, errorMsg: true, createdAt: true, updatedAt: true },
    });

    if (!job)              return jsonError("Job not found.", 404);
    if (job.userId !== user.id) return jsonError("Forbidden.", 403);

    return jsonOk(job);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch job.", 500);
  }
}
