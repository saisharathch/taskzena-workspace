import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceMembership } from "@/lib/auth/authorization";
import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";
import { createProjectSchema } from "@/lib/validation/project";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const payload = createProjectSchema.safeParse(await request.json());

    if (!payload.success) {
      return jsonError("Invalid project payload.", 400, payload.error.flatten());
    }

    await requireWorkspaceMembership(user.id, payload.data.workspaceId);

    const project = await prisma.project.create({
      data: {
        workspaceId: payload.data.workspaceId,
        name: payload.data.name,
        description: payload.data.description || null
      }
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: payload.data.workspaceId,
        actorId: user.id,
        action: "project.created",
        metadata: { projectId: project.id, name: project.name }
      }
    });

    return jsonOk(project, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create project.", 500);
  }
}
