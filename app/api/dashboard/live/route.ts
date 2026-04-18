import { getApiUser } from "@/lib/auth/session";
import { jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { getDashboardData } from "@/lib/services/dashboard";

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const data = await getDashboardData(user.id);

    return jsonOk({
      focusMessage: data.focusMessage,
      projects: data.projects,
      recentActivity: data.recentActivity,
      stats: data.stats,
      tasks: data.tasks,
      workspaces: data.workspaces,
    });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to fetch live dashboard data.");
  }
}
