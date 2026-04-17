import { getApiUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { generateProjectInsights } from "@/lib/ai";
import { Limiters, rateLimitResponse } from "@/lib/rate-limit";

/** POST /api/ai/insights — analyse all tasks in the user's workspaces */
export async function POST() {
  try {
    const user  = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const limit = Limiters.ai(user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      select: { workspaceId: true },
    });
    const workspaceIds = memberships.map((m) => m.workspaceId);

    if (!workspaceIds.length) {
      return jsonOk({
        insights: {
          riskLevel: "LOW",
          summary: "No workspaces found. Create one to get started.",
          atRiskTasks: [],
          workloadWarnings: [],
          recommendations: ["Create a workspace.", "Add a project.", "Start adding tasks."],
          predictedOutcome: "No data yet.",
        },
      });
    }

    const tasks = await prisma.task.findMany({
      where: { project: { workspaceId: { in: workspaceIds } } },
      select: {
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: { select: { fullName: true, email: true } },
      },
      take: 100,
    });

    const simplified = tasks.map((t) => ({
      title:    t.title,
      status:   t.status,
      priority: t.priority,
      dueDate:  t.dueDate,
      assignee: t.assignee?.fullName ?? t.assignee?.email ?? null,
    }));

    const insights = await generateProjectInsights(simplified);
    return jsonOk({ insights });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to generate insights.");
  }
}
