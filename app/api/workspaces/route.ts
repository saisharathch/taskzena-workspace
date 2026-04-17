import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";
import { createWorkspaceSchema } from "@/lib/validation/workspace";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const json = await request.json();
    const data = createWorkspaceSchema.safeParse(json);

    if (!data.success) {
      return jsonError("Invalid workspace payload.", 400, data.error.flatten());
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: data.data.name,
        slug: data.data.slug,
        memberships: {
          create: {
            userId: user.id,
            role: WorkspaceRole.OWNER
          }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: user.id,
        action: "workspace.created",
        metadata: { slug: workspace.slug }
      }
    });

    return jsonOk(workspace, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create workspace.", 500);
  }
}
