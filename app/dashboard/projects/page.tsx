import { requireAppUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboard";
import { LiveProjectsOverview } from "@/components/features/projects/LiveProjectsOverview";
import { ProjectsPageHeader } from "@/components/features/projects/ProjectsPageHeader";

export default async function ProjectsPage() {
  const user = await requireAppUser();
  const data = await getDashboardData(user.id);
  const workspaceOptions = data.workspaces.map((w) => ({ id: w.id, name: w.name }));
  const workspaceIds = data.workspaces.map((workspace) => workspace.id);

  return (
    <div className="dash-page">
      <ProjectsPageHeader workspaces={workspaceOptions} />
      <LiveProjectsOverview
        initialData={{
          focusMessage: data.focusMessage,
          projects: data.projects,
          recentActivity: data.recentActivity,
          stats: data.stats,
          tasks: data.tasks,
          workspaces: data.workspaces,
        }}
        workspaceIds={workspaceIds}
      />
    </div>
  );
}
