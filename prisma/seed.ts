import { PrismaClient, TaskPriority, TaskStatus, WorkspaceRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      authUserId: "demo-auth-user-id",
      email: "demo@example.com",
      fullName: "Demo User"
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace"
    }
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id
      }
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceRole.OWNER
    }
  });

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Launch AI Task Platform",
      description: "Production-style seed project"
    }
  });

  const task = await prisma.task.create({
    data: {
      projectId: project.id,
      assigneeId: user.id,
      title: "Build workspace dashboard",
      description: "Create role-aware dashboard with task counts and recent activity.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH
    }
  });

  await prisma.activityLog.create({
    data: {
      workspaceId: workspace.id,
      taskId: task.id,
      actorId: user.id,
      action: "task.created",
      metadata: {
        title: task.title
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
