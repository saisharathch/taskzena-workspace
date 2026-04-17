import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { WorkspaceRole } from "@prisma/client";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const { workspaceId } = await params;
    await requireWorkspaceRole(user.id, workspaceId, [WorkspaceRole.OWNER], "Only workspace owners can delete a workspace.");

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) return jsonError("Workspace not found.", 404);

    await prisma.workspace.delete({ where: { id: workspaceId } });
    return jsonOk({ deleted: true, workspaceName: workspace.name });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to delete workspace.");
  }
}
