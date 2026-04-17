import test from "node:test";
import assert from "node:assert/strict";

import { WorkspaceRole } from "@prisma/client";

import {
  assertWorkspaceRole,
  getWorkspacePermissions,
  hasWorkspaceRole,
  WORKSPACE_MANAGER_ROLES,
  WORKSPACE_TASK_EDITOR_ROLES,
} from "@/lib/auth/authorization";
import { HttpError } from "@/lib/http";

test("OWNER has full workspace permissions", () => {
  const permissions = getWorkspacePermissions(WorkspaceRole.OWNER);

  assert.equal(permissions.canManageMembers, true);
  assert.equal(permissions.canInviteMembers, true);
  assert.equal(permissions.canManageProjects, true);
  assert.equal(permissions.canManageTasks, true);
  assert.equal(permissions.canDeleteWorkspace, true);
  assert.equal(permissions.canTransferOwnership, true);
});

test("ADMIN can manage workspace operations but not transfer ownership", () => {
  const permissions = getWorkspacePermissions(WorkspaceRole.ADMIN);

  assert.equal(permissions.canManageMembers, true);
  assert.equal(permissions.canInviteMembers, true);
  assert.equal(permissions.canManageProjects, true);
  assert.equal(permissions.canManageTasks, true);
  assert.equal(permissions.canDeleteWorkspace, false);
  assert.equal(permissions.canTransferOwnership, false);
});

test("MEMBER is blocked from admin-only operations", () => {
  const permissions = getWorkspacePermissions(WorkspaceRole.MEMBER);

  assert.equal(permissions.canManageMembers, false);
  assert.equal(permissions.canInviteMembers, false);
  assert.equal(permissions.canManageProjects, false);
  assert.equal(permissions.canManageSettings, false);
  assert.equal(permissions.canManageTasks, true);
});

test("manager role helper allows OWNER and ADMIN", () => {
  assert.equal(hasWorkspaceRole(WorkspaceRole.OWNER, WORKSPACE_MANAGER_ROLES), true);
  assert.equal(hasWorkspaceRole(WorkspaceRole.ADMIN, WORKSPACE_MANAGER_ROLES), true);
  assert.equal(hasWorkspaceRole(WorkspaceRole.MEMBER, WORKSPACE_MANAGER_ROLES), false);
});

test("task editor role helper allows MEMBER task writes", () => {
  assert.equal(hasWorkspaceRole(WorkspaceRole.MEMBER, WORKSPACE_TASK_EDITOR_ROLES), true);
});

test("assertWorkspaceRole throws a 403 HttpError for disallowed roles", () => {
  assert.throws(
    () => assertWorkspaceRole(WorkspaceRole.MEMBER, WORKSPACE_MANAGER_ROLES, "Forbidden."),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 403 &&
      error.message === "Forbidden.",
  );
});
