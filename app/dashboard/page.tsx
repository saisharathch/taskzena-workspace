import { requireAppUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboard";
import { LiveDashboardOverview } from "@/components/features/dashboard/LiveDashboardOverview";
import { PageIntro } from "@/components/layout/PageIntro";

export default async function DashboardPage() {
  const user = await requireAppUser();
  const data = await getDashboardData(user.id);
  const workspaceIds = data.workspaces.map((workspace) => workspace.id);

  return (
    <div className="dash-page">
      <PageIntro
        eyebrow="Dashboard"
        title="Workspace overview"
        description={data.focusMessage}
      />
      <LiveDashboardOverview
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
