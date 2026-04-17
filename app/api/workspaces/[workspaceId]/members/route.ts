import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { getWorkspacePermissions, requireWorkspaceMembership } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { workspaceId } = await params;

    const membership = await requireWorkspaceMembership(user.id, workspaceId);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        invites: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            role: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!workspace) return jsonError("Workspace not found.", 404);

    const permissions = getWorkspacePermissions(membership.role);

    return jsonOk({
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      currentUserId: user.id,
      callerRole: membership.role,
      permissions,
      members: workspace.memberships.map((member) => ({
        id: member.id,
        userId: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email,
        role: member.role,
        joinedAt: member.createdAt,
      })),
      invites: permissions.canManageMembers ? workspace.invites : [],
    });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to load members.");
  }
}
