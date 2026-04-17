import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { requireWorkspaceMembership } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { createCommentSchema } from "@/lib/validation/comment";
import { notifyTaskCommented } from "@/lib/services/notifications";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const payload = createCommentSchema.safeParse(await request.json());

    if (!payload.success) {
      return jsonError("Invalid comment payload.", 400, payload.error.flatten());
    }

    const task = await prisma.task.findUnique({
      where: { id: payload.data.taskId },
      include: {
        project: true
      }
    });

    if (!task) {
      return jsonError("Task not found.", 404);
    }

    await requireWorkspaceMembership(user.id, task.project.workspaceId);

    const comment = await prisma.comment.create({
      data: {
        taskId: payload.data.taskId,
        authorId: user.id,
        body: payload.data.body
      }
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: task.project.workspaceId,
        taskId: task.id,
        actorId: user.id,
        action: "comment.created",
        metadata: { commentId: comment.id }
      }
    });

    // Notify the task's assignee about the new comment (skip if they wrote it)
    if (task.assigneeId && task.assigneeId !== user.id) {
      notifyTaskCommented(
        task.assigneeId,
        task.title,
        task.id,
        task.project.workspaceId,
        user.fullName ?? user.email
      ).catch(() => {});
    }

    return jsonOk(comment, { status: 201 });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to create comment.");
  }
}
