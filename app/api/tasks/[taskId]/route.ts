import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { requireWorkspaceRole, WORKSPACE_MANAGER_ROLES, WORKSPACE_TASK_EDITOR_ROLES } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { updateTaskSchema } from "@/lib/validation/task";
import { notifyTaskAssigned, notifyTaskStatusChanged } from "@/lib/services/notifications";

export async function PATCH(request: Request, context: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { taskId } = await context.params;
    const payload = updateTaskSchema.safeParse(await request.json());

    if (!payload.success) {
      return jsonError("Invalid task update payload.", 400, payload.error.flatten());
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!existingTask) {
      return jsonError("Task not found.", 404);
    }

    await requireWorkspaceRole(
      user.id,
      existingTask.project.workspaceId,
      WORKSPACE_TASK_EDITOR_ROLES,
      "You do not have permission to update tasks in this workspace.",
    );

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: payload.data.title ?? undefined,
        description: payload.data.description === undefined ? undefined : payload.data.description || null,
        priority: payload.data.priority ?? undefined,
        status: payload.data.status ?? undefined,
        assigneeId: payload.data.assigneeId === undefined ? undefined : payload.data.assigneeId,
        dueDate: payload.data.dueDate === undefined ? undefined : payload.data.dueDate ? new Date(payload.data.dueDate) : null
      }
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: existingTask.project.workspaceId,
        taskId: task.id,
        actorId: user.id,
        action: "task.updated",
        metadata: payload.data
      }
    });

    const actorName = user.fullName ?? user.email;

    // Notify assignee when status changes (skip if they made the change themselves)
    if (payload.data.status && task.assigneeId && task.assigneeId !== user.id) {
      notifyTaskStatusChanged(
        task.assigneeId,
        existingTask.title,
        task.id,
        existingTask.project.workspaceId,
        payload.data.status,
        actorName
      ).catch(() => {});
    }

    // Notify newly assigned user (skip if they assigned themselves)
    if (
      payload.data.assigneeId &&
      payload.data.assigneeId !== existingTask.assigneeId &&
      payload.data.assigneeId !== user.id
    ) {
      notifyTaskAssigned(
        payload.data.assigneeId,
        existingTask.title,
        task.id,
        existingTask.project.workspaceId,
        actorName
      ).catch(() => {});
    }

    return jsonOk(task);
  } catch (error) {
    // Re-throw Next.js redirect / not-found errors so they work correctly
    if (error instanceof Error && "digest" in error) throw error;
    return jsonErrorFromUnknown(error, "Failed to update task.");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { taskId } = await context.params;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!existingTask) {
      return jsonError("Task not found.", 404);
    }

    await requireWorkspaceRole(
      user.id,
      existingTask.project.workspaceId,
      WORKSPACE_MANAGER_ROLES,
      "Only owners and admins can delete tasks.",
    );

    await prisma.task.delete({ where: { id: taskId } });

    await prisma.activityLog.create({
      data: {
        workspaceId: existingTask.project.workspaceId,
        actorId: user.id,
        action: "task.deleted",
        metadata: { taskId }
      }
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return jsonErrorFromUnknown(error, "Failed to delete task.");
  }
}
