import { requireAppUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboard";
import { TasksPageClient } from "./TasksPageClient";

export default async function TasksPage() {
  const user = await requireAppUser();
  const data = await getDashboardData(user.id);
  const workspaceIds = data.workspaces.map((w) => w.id);

  return (
    <TasksPageClient
      tasks={data.tasks}
      workspaceIds={workspaceIds}
      projects={data.projectOptions}
      membersByWorkspace={data.membersByWorkspace}
    />
  );
}
