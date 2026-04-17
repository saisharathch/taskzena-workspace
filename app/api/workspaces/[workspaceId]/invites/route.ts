import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { getWorkspacePermissions, requireWorkspaceMembership, requireWorkspaceRole } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { publicEnv } from "@/lib/env/public";
import { sendInviteEmail } from "@/lib/email";
import { Limiters, rateLimitResponse } from "@/lib/rate-limit";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const createInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.nativeEnum(WorkspaceRole).default("MEMBER"),
});

/** GET /api/workspaces/[workspaceId]/invites — list pending invites */
export async function GET(_req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { workspaceId } = await params;
    const membership = await requireWorkspaceMembership(user.id, workspaceId);
    const permissions = getWorkspacePermissions(membership.role);

    if (!permissions.canManageMembers) {
      return jsonOk([]);
    }

    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, role: true, expiresAt: true, createdAt: true,
        invitedBy: { select: { fullName: true, email: true } },
      },
    });

    return jsonOk(invites);
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to list invites.");
  }
}

/** POST /api/workspaces/[workspaceId]/invites — create + send invite */
export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { workspaceId } = await params;

    const limit = Limiters.invite(workspaceId);
    if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

    const membership = await requireWorkspaceRole(
      user.id,
      workspaceId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
      "Only owners and admins can invite teammates.",
    );

    const body = createInviteSchema.safeParse(await request.json());
    if (!body.success) return jsonError("Invalid invite payload.", 400, body.error.flatten());
    if (membership.role !== "OWNER" && body.data.role === "OWNER") {
      return jsonError("Only owners can invite another owner.", 403);
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
    if (!workspace) return jsonError("Workspace not found.", 404);

    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: body.data.email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });
    if (existingUser) {
      const existingMembership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: existingUser.id,
          },
        },
      });
      if (existingMembership) {
        return jsonError("This user is already a member of the workspace.", 409);
      }
    }

    // Check for existing pending invite
    const existing = await prisma.workspaceInvite.findFirst({
      where: {
        workspaceId,
        status: "PENDING",
        email: {
          equals: body.data.email,
          mode: "insensitive",
        },
      },
    });
    if (existing) return jsonError("An invite for this email is already pending.", 409);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: body.data.email,
        role: body.data.role,
        invitedById: user.id,
        expiresAt,
      },
    });

    const appUrl = publicEnv.NEXT_PUBLIC_APP_URL;
    const inviteUrl = `${appUrl}/invite/${invite.token}`;
    const inviterName = user.fullName ?? user.email ?? "A teammate";

    await sendInviteEmail({
      to: body.data.email,
      workspaceName: workspace.name,
      inviterName,
      inviteUrl,
      expiresAt,
    });

    return jsonOk({ invite: { id: invite.id, token: invite.token, inviteUrl } }, { status: 201 });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to send invite.");
  }
}
