import { requireAppUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboard";
import { ActivityTimeline } from "@/components/features/analytics/ActivityWeeklySummarySection";
import { PageIntro } from "@/components/layout/PageIntro";

export default async function ActivityPage() {
  const user = await requireAppUser();
  const data = await getDashboardData(user.id);

  return (
    <div className="dash-page">
      <PageIntro
        eyebrow="Activity"
        title="Workspace activity feed"
        description="Follow team movement, comments, task updates, and project events in one timeline."
      />
      <ActivityTimeline activity={data.recentActivity} />
    </div>
  );
}
