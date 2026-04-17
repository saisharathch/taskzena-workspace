import { requireAppUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboard";
import { ProjectPortfolioTable } from "@/components/features/projects/ProjectPortfolioTable";
import { ProjectDetailsGrid } from "@/components/features/projects/ProjectDetailsGrid";
import { ProjectsPageHeader } from "@/components/features/projects/ProjectsPageHeader";

export default async function ProjectsPage() {
  const user = await requireAppUser();
  const data = await getDashboardData(user.id);
  const workspaceOptions = data.workspaces.map((w) => ({ id: w.id, name: w.name }));

  return (
    <div className="dash-page">
      <ProjectsPageHeader workspaces={workspaceOptions} />
      <ProjectPortfolioTable projects={data.projects} />
      <ProjectDetailsGrid projects={data.projects} />
    </div>
  );
}
