import test from "node:test";
import assert from "node:assert/strict";

import { formatActivityItem, getActivityEventType } from "@/lib/activity";

test("formats task status changes into natural language", () => {
  const item = formatActivityItem({
    id: "log-1",
    action: "task.status_changed",
    createdAt: new Date("2026-04-17T10:00:00.000Z"),
    metadata: {
      title: "API integration",
      previousStatus: "IN_PROGRESS",
      nextStatus: "DONE",
    },
    actor: {
      id: "user-1",
      fullName: "John",
      email: "john@example.com",
    },
    task: {
      id: "task-1",
      title: "API integration",
    },
    workspace: {
      id: "workspace-1",
      name: "Product Team",
    },
  });

  assert.equal(item.eventType, "task");
  assert.equal(item.entityType, "task");
  assert.match(item.title, /John moved task "API integration" to Done/);
  assert.match(item.description, /In Progress/);
});

test("formats member role updates with member context", () => {
  const item = formatActivityItem({
    id: "log-2",
    action: "workspace.member_role_updated",
    createdAt: new Date("2026-04-17T10:00:00.000Z"),
    metadata: {
      memberName: "Priya",
      fromRole: "MEMBER",
      toRole: "ADMIN",
    },
    actor: {
      id: "user-2",
      fullName: "Alex",
      email: "alex@example.com",
    },
    task: null,
    workspace: {
      id: "workspace-1",
      name: "Product Team",
    },
  });

  assert.equal(item.eventType, "member");
  assert.match(item.title, /Alex changed Priya from member to admin/);
});

test("maps actions to event types", () => {
  assert.equal(getActivityEventType("comment.created"), "comment");
  assert.equal(getActivityEventType("project.created"), "project");
  assert.equal(getActivityEventType("workspace.member_removed"), "member");
});
