import { requireAppUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboard";
import { TaskChartsSection } from "@/components/features/analytics/TaskChartsSection";

export default async function AnalyticsPage() {
  const user = await requireAppUser();
  const data = await getDashboardData(user.id);

  return (
    <div className="dash-page">
      <TaskChartsSection tasks={data.tasks} projects={data.projects} />
    </div>
  );
}
