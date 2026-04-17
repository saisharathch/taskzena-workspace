import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function requireWorkspaceMembership(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId
      }
    }
  });

  if (!membership) {
    throw new Error("You do not have access to this workspace.");
  }

  return membership;
}

export function canManageWorkspace(role: WorkspaceRole) {
  return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;
}
