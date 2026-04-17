import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { enforceRateLimit, RateLimitPresets } from "@/lib/rate-limit";
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
    const limitResponse = enforceRateLimit({
      request,
      route: "workspaces:members:update-role",
      rules: [...RateLimitPresets.mutation, ...RateLimitPresets.sensitiveMutation],
      userId: user.id,
    });
    if (limitResponse) return limitResponse;
    const { workspaceId, memberId } = await params;

    const callerMembership = await requireWorkspaceRole(
      user.id,
      workspaceId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
      "Only owners and admins can change roles.",
    );

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
    return jsonErrorFromUnknown(error, "Failed to update role.");
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
    const limitResponse = enforceRateLimit({
      request: _req,
      route: "workspaces:members:remove",
      rules: [...RateLimitPresets.mutation, ...RateLimitPresets.sensitiveMutation],
      userId: user.id,
    });
    if (limitResponse) return limitResponse;
    const { workspaceId, memberId } = await params;

    const callerMembership = await requireWorkspaceRole(
      user.id,
      workspaceId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
      "Only owners and admins can remove members.",
    );

    const target = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!target || target.workspaceId !== workspaceId) return jsonError("Member not found.", 404);
    if (target.userId === user.id) return jsonError("You cannot remove yourself.", 400);
    if (callerMembership.role !== "OWNER" && target.role === "OWNER") {
      return jsonError("Only owners can remove another owner.", 403);
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return jsonOk({ removed: true });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to remove member.");
  }
}
