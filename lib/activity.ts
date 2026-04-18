export type ActivityEventType = "all" | "task" | "comment" | "project" | "workspace" | "member";

export type ActivityFeedItem = {
  id: string;
  action: string;
  createdAt: Date | string;
  actor: {
    id: string | null;
    name: string;
    email: string | null;
  } | null;
  iconKey: string;
  eventType: Exclude<ActivityEventType, "all">;
  entityType: "task" | "project" | "workspace" | "member" | "comment";
  entityName: string | null;
  title: string;
  description: string;
  workspace: {
    id: string;
    name: string;
  };
};

export type ActivityActorOption = {
  id: string;
  label: string;
};

type ActivityLogShape = {
  id: string;
  action: string;
  createdAt: Date;
  metadata: unknown;
  actor: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
  task: {
    id: string;
    title: string;
  } | null;
  workspace: {
    id: string;
    name: string;
  };
};

export const ACTIVITY_EVENT_TYPE_OPTIONS: Array<{
  value: ActivityEventType;
  label: string;
}> = [
  { value: "all", label: "All activity" },
  { value: "task", label: "Tasks" },
  { value: "comment", label: "Comments" },
  { value: "project", label: "Projects" },
  { value: "member", label: "Members" },
  { value: "workspace", label: "Workspace" },
];

export const ACTIVITY_ACTIONS_BY_EVENT_TYPE: Record<Exclude<ActivityEventType, "all">, string[]> = {
  task: ["task.created", "task.updated", "task.deleted", "task.completed", "task.status_changed"],
  comment: ["comment.added", "comment.created"],
  project: ["project.created", "project.updated"],
  workspace: ["workspace.created", "workspace.settings_updated"],
  member: [
    "workspace.member_invited",
    "workspace.member_joined",
    "workspace.member_removed",
    "workspace.member_role_updated",
  ],
};

function readObject(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readEntityName(log: ActivityLogShape, metadata: Record<string, unknown>) {
  return (
    readString(metadata, "title") ??
    readString(metadata, "taskTitle") ??
    readString(metadata, "projectName") ??
    readString(metadata, "workspaceName") ??
    readString(metadata, "memberName") ??
    readString(metadata, "email") ??
    log.task?.title ??
    null
  );
}

function formatStatus(status: string | null) {
  if (!status) return "Updated";

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRole(role: string | null) {
  if (!role) return "member";
  return role.toLowerCase();
}

function actorLabel(log: ActivityLogShape) {
  return log.actor?.fullName ?? log.actor?.email ?? "System";
}

export function getActivityEventType(action: string): Exclude<ActivityEventType, "all"> {
  for (const [eventType, actions] of Object.entries(ACTIVITY_ACTIONS_BY_EVENT_TYPE)) {
    if (actions.includes(action)) {
      return eventType as Exclude<ActivityEventType, "all">;
    }
  }

  return "workspace";
}

export function formatActivityItem(log: ActivityLogShape): ActivityFeedItem {
  const metadata = readObject(log.metadata);
  const actor = actorLabel(log);
  const entityName = readEntityName(log, metadata);
  const previousStatus = readString(metadata, "previousStatus");
  const nextStatus = readString(metadata, "nextStatus") ?? readString(metadata, "status");
  const memberName = readString(metadata, "memberName") ?? readString(metadata, "email");
  const previousRole = readString(metadata, "fromRole");
  const nextRole = readString(metadata, "toRole");

  switch (log.action) {
    case "task.created":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "task-create",
        eventType: "task",
        entityType: "task",
        entityName,
        title: `${actor} created task "${entityName ?? "Untitled task"}"`,
        description: `New task added in ${log.workspace.name}.`,
        workspace: log.workspace,
      };
    case "task.status_changed":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "task-move",
        eventType: "task",
        entityType: "task",
        entityName,
        title: `${actor} moved task "${entityName ?? "Untitled task"}" to ${formatStatus(nextStatus)}`,
        description: previousStatus
          ? `Status changed from ${formatStatus(previousStatus)} to ${formatStatus(nextStatus)}.`
          : `Task status is now ${formatStatus(nextStatus)}.`,
        workspace: log.workspace,
      };
    case "task.updated":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "task-update",
        eventType: "task",
        entityType: "task",
        entityName,
        title: `${actor} updated task "${entityName ?? "Untitled task"}"`,
        description: `Task details were edited in ${log.workspace.name}.`,
        workspace: log.workspace,
      };
    case "task.deleted":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "task-delete",
        eventType: "task",
        entityType: "task",
        entityName,
        title: `${actor} deleted task "${entityName ?? "Untitled task"}"`,
        description: `The task was removed from ${log.workspace.name}.`,
        workspace: log.workspace,
      };
    case "comment.added":
    case "comment.created":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "comment",
        eventType: "comment",
        entityType: "comment",
        entityName,
        title: `${actor} commented on "${entityName ?? "task"}"`,
        description: `A new comment was added in ${log.workspace.name}.`,
        workspace: log.workspace,
      };
    case "project.created":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "project",
        eventType: "project",
        entityType: "project",
        entityName,
        title: `${actor} created project "${entityName ?? "Untitled project"}"`,
        description: `New project added to ${log.workspace.name}.`,
        workspace: log.workspace,
      };
    case "workspace.member_invited":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "member-invite",
        eventType: "member",
        entityType: "member",
        entityName: memberName,
        title: `${actor} invited ${memberName ?? "a teammate"} to ${log.workspace.name}`,
        description: `Invite sent with ${formatRole(readString(metadata, "role"))} access.`,
        workspace: log.workspace,
      };
    case "workspace.member_joined":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "member-join",
        eventType: "member",
        entityType: "member",
        entityName: memberName ?? actor,
        title: `${memberName ?? actor} joined ${log.workspace.name}`,
        description: `Joined with ${formatRole(readString(metadata, "role"))} access.`,
        workspace: log.workspace,
      };
    case "workspace.member_removed":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "member-remove",
        eventType: "member",
        entityType: "member",
        entityName: memberName,
        title: `${actor} removed ${memberName ?? "a teammate"} from ${log.workspace.name}`,
        description: `Previous role: ${formatRole(readString(metadata, "removedRole"))}.`,
        workspace: log.workspace,
      };
    case "workspace.member_role_updated":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "member-role",
        eventType: "member",
        entityType: "member",
        entityName: memberName,
        title: `${actor} changed ${memberName ?? "a teammate"} from ${formatRole(previousRole)} to ${formatRole(nextRole)}`,
        description: `Role update in ${log.workspace.name}.`,
        workspace: log.workspace,
      };
    case "workspace.created":
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "workspace",
        eventType: "workspace",
        entityType: "workspace",
        entityName: log.workspace.name,
        title: `${actor} created workspace "${log.workspace.name}"`,
        description: `Workspace setup is ready for projects, tasks, and teammates.`,
        workspace: log.workspace,
      };
    default:
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: actor, email: log.actor.email }
          : null,
        iconKey: "activity",
        eventType: getActivityEventType(log.action),
        entityType: "workspace",
        entityName,
        title: `${actor} performed ${log.action.replace(/[._]/g, " ")}`,
        description: `Activity recorded in ${log.workspace.name}.`,
        workspace: log.workspace,
      };
  }
}
