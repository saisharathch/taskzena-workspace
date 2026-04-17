import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { KanbanBoard } from "@/components/features/tasks/KanbanBoard";

export default async function KanbanPage() {
  const user = await requireAppUser();

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const tasks = workspaceIds.length
    ? await prisma.task.findMany({
        where: { project: { workspaceId: { in: workspaceIds } } },
        include: {
          project: { include: { workspace: { select: { id: true, name: true } } } },
          assignee: { select: { fullName: true, email: true } },
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        take: 200,
      })
    : [];

  return (
    <div className="dash-page">
      <div className="dash-page-header">
        <h1 className="dash-page-title">Kanban Board</h1>
        <p className="dash-page-subtitle">
          Drag tasks across columns to update their status instantly.
        </p>
      </div>
      <KanbanBoard initialTasks={tasks as Parameters<typeof KanbanBoard>[0]["initialTasks"]} />
    </div>
  );
}
