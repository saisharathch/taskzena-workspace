import { requireAppUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboard";
import { StatsGrid } from "@/components/features/analytics/StatsGrid";
import { SmartInsightsPanel } from "@/components/features/ai/SmartInsightsPanel";
import { WeeklySummary } from "@/components/features/analytics/ActivityWeeklySummarySection";
import { PageIntro } from "@/components/layout/PageIntro";

export default async function DashboardPage() {
  const user = await requireAppUser();
  const data = await getDashboardData(user.id);

  return (
    <div className="dash-page">
      <PageIntro
        eyebrow="Dashboard"
        title="Workspace overview"
        description={data.focusMessage}
      />
      <StatsGrid stats={data.stats} />
      <div className="dash-overview-grid">
        <SmartInsightsPanel
          tasks={data.tasks}
          stats={data.stats}
          workspaces={data.workspaces}
        />
        <WeeklySummary stats={data.stats} tasks={data.tasks} />
      </div>
    </div>
  );
}
