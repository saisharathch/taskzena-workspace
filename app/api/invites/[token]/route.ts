import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";
import { notifyMemberJoined } from "@/lib/services/notifications";

/** GET /api/invites/[token] — fetch invite details (public, no auth required) */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        workspace: { select: { id: true, name: true } },
        invitedBy: { select: { fullName: true, email: true } },
      },
    });

    if (!invite) return jsonError("Invite not found.", 404);
    if (invite.status !== "PENDING") return jsonError(`Invite is ${invite.status.toLowerCase()}.`, 410);
    if (invite.expiresAt < new Date()) {
      await prisma.workspaceInvite.update({ where: { token }, data: { status: "EXPIRED" } });
      return jsonError("This invite has expired.", 410);
    }

    return jsonOk(invite);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch invite.", 500);
  }
}

/** POST /api/invites/[token] — accept invite */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { token } = await params;

    const invite = await prisma.workspaceInvite.findUnique({ where: { token } });
    if (!invite) return jsonError("Invite not found.", 404);
    if (invite.status !== "PENDING") return jsonError(`Invite is already ${invite.status.toLowerCase()}.`, 410);
    if (invite.expiresAt < new Date()) {
      await prisma.workspaceInvite.update({ where: { token }, data: { status: "EXPIRED" } });
      return jsonError("This invite has expired.", 410);
    }

    // Check not already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
    });
    if (existing) {
      await prisma.workspaceInvite.update({ where: { token }, data: { status: "ACCEPTED" } });
      return jsonOk({ message: "You are already a member of this workspace." });
    }

    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
      }),
      prisma.workspaceInvite.update({ where: { token }, data: { status: "ACCEPTED" } }),
      prisma.activityLog.create({
        data: {
          workspaceId: invite.workspaceId,
          actorId: user.id,
          action: "workspace.member_joined",
          metadata: {
            email: user.email,
            memberName: user.fullName ?? user.email,
            role: invite.role,
          },
        },
      }),
    ]);

    // Notify workspace owners that a new member joined
    const owners = await prisma.workspaceMember.findMany({
      where: { workspaceId: invite.workspaceId, role: "OWNER" },
      include: { workspace: true },
    });
    const memberName = user.fullName ?? user.email;
    for (const owner of owners) {
      if (owner.userId !== user.id) {
        notifyMemberJoined(
          owner.userId,
          owner.workspace.name,
          invite.workspaceId,
          memberName
        ).catch(() => {});
      }
    }

    return jsonOk({ workspaceId: invite.workspaceId });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to accept invite.", 500);
  }
}
