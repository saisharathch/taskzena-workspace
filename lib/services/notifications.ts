import { prisma } from "@/lib/db/prisma";
import { NotificationType } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────

export type CreateNotificationPayload = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  linkHref?: string;
  taskId?: string;
  workspaceId?: string;
};

// ── Factories ─────────────────────────────────────────────────────────────

export async function notifyTaskAssigned(
  assigneeId: string,
  taskTitle: string,
  taskId: string,
  workspaceId: string,
  assignerName: string
) {
  return prisma.notification.create({
    data: {
      userId: assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: "Task assigned to you",
      body: `${assignerName} assigned "${taskTitle}" to you.`,
      linkHref: `/dashboard`,
      taskId,
      workspaceId,
    },
  });
}

export async function notifyTaskCommented(
  taskOwnerId: string,
  taskTitle: string,
  taskId: string,
  workspaceId: string,
  commenterName: string
) {
  return prisma.notification.create({
    data: {
      userId: taskOwnerId,
      type: NotificationType.TASK_COMMENTED,
      title: "New comment on your task",
      body: `${commenterName} commented on "${taskTitle}".`,
      linkHref: `/dashboard`,
      taskId,
      workspaceId,
    },
  });
}

export async function notifyTaskStatusChanged(
  assigneeId: string,
  taskTitle: string,
  taskId: string,
  workspaceId: string,
  newStatus: string,
  changerName: string
) {
  return prisma.notification.create({
    data: {
      userId: assigneeId,
      type: NotificationType.TASK_STATUS_CHANGED,
      title: "Task status updated",
      body: `${changerName} moved "${taskTitle}" to ${newStatus.replace("_", " ")}.`,
      linkHref: `/dashboard`,
      taskId,
      workspaceId,
    },
  });
}

export async function notifyMemberJoined(
  workspaceOwnerId: string,
  workspaceName: string,
  workspaceId: string,
  newMemberName: string
) {
  return prisma.notification.create({
    data: {
      userId: workspaceOwnerId,
      type: NotificationType.MEMBER_JOINED,
      title: "New member joined",
      body: `${newMemberName} joined your workspace "${workspaceName}".`,
      linkHref: `/dashboard/settings/${workspaceId}`,
      workspaceId,
    },
  });
}

export async function notifyAIJobDone(
  userId: string,
  taskTitle: string
) {
  return prisma.notification.create({
    data: {
      userId,
      type: NotificationType.AI_JOB_DONE,
      title: "AI analysis complete",
      body: `Insights are ready for "${taskTitle}".`,
      linkHref: `/dashboard`,
    },
  });
}

// ── Batch deadline notifications ──────────────────────────────────────────
// Called from a cron/scheduled job or on dashboard load.
// Creates TASK_DUE_SOON / TASK_OVERDUE notifications for tasks
// that don't already have a recent one.

export async function createDeadlineNotifications(workspaceIds: string[]) {
  if (!workspaceIds.length) return;

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const dueSoon = await prisma.task.findMany({
    where: {
      project: { workspaceId: { in: workspaceIds } },
      status: { notIn: ["DONE"] },
      dueDate: { gte: now, lte: in48h },
      assigneeId: { not: null },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      assigneeId: true,
      project: { select: { workspaceId: true } },
    },
  });

  const overdue = await prisma.task.findMany({
    where: {
      project: { workspaceId: { in: workspaceIds } },
      status: { notIn: ["DONE"] },
      dueDate: { lt: now },
      assigneeId: { not: null },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      assigneeId: true,
      project: { select: { workspaceId: true } },
    },
  });

  // Avoid spamming — only create if no notification in last 24h for that task+type
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const createIfNew = async (
    task: { id: string; title: string; assigneeId: string | null; project: { workspaceId: string } },
    type: NotificationType,
    title: string,
    body: string
  ) => {
    if (!task.assigneeId) return;
    const existing = await prisma.notification.findFirst({
      where: {
        userId: task.assigneeId,
        taskId: task.id,
        type,
        createdAt: { gte: cutoff },
      },
    });
    if (existing) return;
    await prisma.notification.create({
      data: {
        userId: task.assigneeId,
        type,
        title,
        body,
        linkHref: `/dashboard`,
        taskId: task.id,
        workspaceId: task.project.workspaceId,
      },
    });
  };

  for (const t of dueSoon) {
    await createIfNew(t, NotificationType.TASK_DUE_SOON, "Task due soon", `"${t.title}" is due in less than 48 hours.`);
  }
  for (const t of overdue) {
    await createIfNew(t, NotificationType.TASK_OVERDUE, "Task overdue", `"${t.title}" is past its deadline.`);
  }
}
