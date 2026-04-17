import { requireAppUser } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAppUser();
  const userName = user.fullName ?? user.email ?? "User";

  return (
    <div className="dash-layout">
      <DashboardSidebar userName={userName} />
      <div className="dash-main">
        <DashboardTopbar userName={userName} />
        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}
