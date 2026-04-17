import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { HttpError } from "@/lib/http";

export const WORKSPACE_MANAGER_ROLES = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN] as const;
export const WORKSPACE_TASK_EDITOR_ROLES = [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.MEMBER,
] as const;

export type AllowedWorkspaceRole = WorkspaceRole | (typeof WORKSPACE_MANAGER_ROLES)[number];

export function hasWorkspaceRole(role: WorkspaceRole, allowedRoles: readonly WorkspaceRole[]) {
  return allowedRoles.includes(role);
}

export function assertWorkspaceRole(
  role: WorkspaceRole,
  allowedRoles: readonly WorkspaceRole[],
  message = "You do not have permission to perform this action.",
) {
  if (!hasWorkspaceRole(role, allowedRoles)) {
    throw new HttpError(403, message);
  }
}

export function getWorkspacePermissions(role: WorkspaceRole) {
  const canManageWorkspace = hasWorkspaceRole(role, WORKSPACE_MANAGER_ROLES);

  return {
    canDeleteWorkspace: role === WorkspaceRole.OWNER,
    canInviteMembers: canManageWorkspace,
    canManageMembers: canManageWorkspace,
    canManageProjects: canManageWorkspace,
    canManageSettings: canManageWorkspace,
    canManageTasks: hasWorkspaceRole(role, WORKSPACE_TASK_EDITOR_ROLES),
    canTransferOwnership: role === WorkspaceRole.OWNER,
  };
}

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
    throw new HttpError(403, "You do not have access to this workspace.");
  }

  return membership;
}

export function canManageWorkspace(role: WorkspaceRole) {
  return hasWorkspaceRole(role, WORKSPACE_MANAGER_ROLES);
}

export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  allowedRoles: readonly WorkspaceRole[],
  message = "You do not have permission to perform this action.",
) {
  const membership = await requireWorkspaceMembership(userId, workspaceId);
  assertWorkspaceRole(membership.role, allowedRoles, message);
  return membership;
}
