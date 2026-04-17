import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { enforceRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { createProjectSchema } from "@/lib/validation/project";
import { WorkspaceRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const limitResponse = enforceRateLimit({
      request,
      route: "projects:create",
      rules: RateLimitPresets.mutation,
      userId: user.id,
    });
    if (limitResponse) return limitResponse;
    const payload = createProjectSchema.safeParse(await request.json());

    if (!payload.success) {
      return jsonError("Invalid project payload.", 400, payload.error.flatten());
    }

    await requireWorkspaceRole(
      user.id,
      payload.data.workspaceId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
      "Only owners and admins can create projects.",
    );

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
    return jsonErrorFromUnknown(error, "Failed to create project.");
  }
}
