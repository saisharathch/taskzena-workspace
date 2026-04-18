import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { requireWorkspaceRole, WORKSPACE_TASK_EDITOR_ROLES } from "@/lib/auth/authorization";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { buildCursorPage, parseCursorPagination } from "@/lib/pagination";
import { enforceRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { createTaskSchema } from "@/lib/validation/task";

export async function GET(request: Request) {
  try {
    const user   = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const url    = new URL(request.url);
    const status   = url.searchParams.get("status")   || undefined;
    const priority = url.searchParams.get("priority") || undefined;
    const search   = url.searchParams.get("search")   || undefined;
    const { cursor, limit } = parseCursorPagination(url, { defaultLimit: 25, maxLimit: 100 });

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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return jsonOk(buildCursorPage(tasks, limit));
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to fetch tasks.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const limitResponse = enforceRateLimit({
      request,
      route: "tasks:create",
      rules: RateLimitPresets.mutation,
      userId: user.id,
    });
    if (limitResponse) return limitResponse;
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
