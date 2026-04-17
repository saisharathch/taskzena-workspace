import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { requireWorkspaceRole, WORKSPACE_TASK_EDITOR_ROLES } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { createTaskSchema } from "@/lib/validation/task";

export async function GET(request: Request) {
  try {
    const user   = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const url    = new URL(request.url);
    const status   = url.searchParams.get("status")   || undefined;
    const priority = url.searchParams.get("priority") || undefined;
    const search   = url.searchParams.get("search")   || undefined;
    const cursor   = url.searchParams.get("cursor")   || undefined; // cursor-based pagination
    const limit    = Math.min(Number(url.searchParams.get("limit") || 25), 100);

    const where = {
      project: {
        workspace: {
          memberships: { some: { userId: user.id } },
        },
      },
      ...(status   && Object.values(TaskStatus).includes(status as TaskStatus)
        ? { status: status as TaskStatus } : {}),
      ...(priority && Object.values(TaskPriority).includes(priority as TaskPriority)
        ? { priority: priority as TaskPriority } : {}),
      ...(search
        ? {
            OR: [
              { title:       { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    // Fetch limit+1 to determine if there is a next page
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { include: { workspace: true } },
        assignee: true,
        comments: { select: { id: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take:   limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore   = tasks.length > limit;
    const items     = hasMore ? tasks.slice(0, limit) : tasks;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return jsonOk({ tasks: items, nextCursor, hasMore });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to fetch tasks.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const payload = createTaskSchema.safeParse(await request.json());

    if (!payload.success) {
      return jsonError("Invalid task payload.", 400, payload.error.flatten());
    }

    const project = await prisma.project.findUnique({
      where: { id: payload.data.projectId },
      include: { workspace: true }
    });

    if (!project) {
      return jsonError("Project not found.", 404);
    }

    await requireWorkspaceRole(
      user.id,
      project.workspaceId,
      WORKSPACE_TASK_EDITOR_ROLES,
      "You do not have permission to create tasks in this workspace.",
    );

    const task = await prisma.task.create({
      data: {
        projectId: payload.data.projectId,
        title: payload.data.title,
        description: payload.data.description || null,
        priority: payload.data.priority,
        status: payload.data.status,
        assigneeId: payload.data.assigneeId || null,
        dueDate: payload.data.dueDate ? new Date(payload.data.dueDate) : null
      }
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: project.workspaceId,
        taskId: task.id,
        actorId: user.id,
        action: "task.created",
        metadata: { title: task.title, projectId: project.id }
      }
    });

    return jsonOk(task, { status: 201 });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to create task.");
  }
}
