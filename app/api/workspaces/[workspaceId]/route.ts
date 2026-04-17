import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { requireWorkspaceMembership } from "@/lib/auth/authorization";
import { jsonError, jsonOk } from "@/lib/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const { workspaceId } = await params;
    const membership = await requireWorkspaceMembership(user.id, workspaceId);

    if (membership.role !== "OWNER") {
      return jsonError("Only workspace owners can delete a workspace.", 403);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) return jsonError("Workspace not found.", 404);

    await prisma.workspace.delete({ where: { id: workspaceId } });
    return jsonOk({ deleted: true, workspaceName: workspace.name });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to delete workspace.", 500);
  }
}
