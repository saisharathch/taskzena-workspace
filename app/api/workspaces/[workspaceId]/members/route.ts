import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { getWorkspacePermissions, requireWorkspaceMembership } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { buildCursorPage, parseCursorPagination } from "@/lib/pagination";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { workspaceId } = await params;
    const { limit, cursor } = parseCursorPagination(req, { defaultLimit: 20, maxLimit: 100 });

    const membership = await requireWorkspaceMembership(user.id, workspaceId);
    const [workspace, memberships, invites] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true },
      }),
      prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.workspaceInvite.findMany({
        where: { workspaceId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
    ]);

    if (!workspace) return jsonError("Workspace not found.", 404);

    const permissions = getWorkspacePermissions(membership.role);
    const page = buildCursorPage(memberships, limit);

    return jsonOk({
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      currentUserId: user.id,
      callerRole: membership.role,
      permissions,
      members: page.data.map((member) => ({
        id: member.id,
        userId: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email,
        role: member.role,
        joinedAt: member.createdAt,
      })),
      nextCursor: page.nextCursor,
      invites: permissions.canManageMembers ? invites : [],
    });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to load members.");
  }
}
