import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { requireWorkspaceMembership } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { enforceRateLimit, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const limitResponse = enforceRateLimit({
      request: _request,
      route: "workspaces:leave",
      rules: RateLimitPresets.mutation,
      userId: user.id,
    });
    if (limitResponse) return limitResponse;

    const { workspaceId } = await params;
    const membership = await requireWorkspaceMembership(user.id, workspaceId);

    if (membership.role === "OWNER") {
      return jsonError("Owners must transfer ownership or delete the workspace instead.", 400);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) return jsonError("Workspace not found.", 404);

    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    return jsonOk({ left: true, workspaceName: workspace.name });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to leave workspace.");
  }
}
