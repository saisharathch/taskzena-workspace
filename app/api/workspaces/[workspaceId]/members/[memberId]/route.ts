import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { canManageWorkspace, requireWorkspaceMembership } from "@/lib/auth/authorization";
import { jsonError, jsonOk } from "@/lib/http";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  role: z.nativeEnum(WorkspaceRole),
});

/** PATCH — change a member's role */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { workspaceId, memberId } = await params;

    const callerMembership = await requireWorkspaceMembership(user.id, workspaceId);
    if (!canManageWorkspace(callerMembership.role)) {
      return jsonError("Only owners and admins can change roles.", 403);
    }

    const body = updateSchema.safeParse(await request.json());
    if (!body.success) return jsonError("Invalid role.", 400, body.error.flatten());

    const target = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!target || target.workspaceId !== workspaceId) return jsonError("Member not found.", 404);
    if (target.userId === user.id) return jsonError("You cannot change your own role.", 400);
    if (callerMembership.role !== "OWNER" && (target.role === "OWNER" || body.data.role === "OWNER")) {
      return jsonError("Only owners can manage owner roles.", 403);
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: body.data.role },
    });

    return jsonOk(updated);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update role.", 500);
  }
}

/** DELETE — remove a member */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { workspaceId, memberId } = await params;

    const callerMembership = await requireWorkspaceMembership(user.id, workspaceId);
    if (!canManageWorkspace(callerMembership.role)) {
      return jsonError("Only owners and admins can remove members.", 403);
    }

    const target = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!target || target.workspaceId !== workspaceId) return jsonError("Member not found.", 404);
    if (target.userId === user.id) return jsonError("You cannot remove yourself.", 400);
    if (callerMembership.role !== "OWNER" && target.role === "OWNER") {
      return jsonError("Only owners can remove another owner.", 403);
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return jsonOk({ removed: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to remove member.", 500);
  }
}
