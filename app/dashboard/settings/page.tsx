import { prisma } from "@/lib/db/prisma";
import { requireAppUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboard";
import { SettingsControlCenter } from "@/components/shared/SettingsControlCenter";

export default async function SettingsPage() {
  const user = await requireAppUser();
  const data = await getDashboardData(user.id);
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              memberships: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const rolePriority = { OWNER: 3, ADMIN: 2, MEMBER: 1 } as const;
  const primaryRole =
    memberships
      .map((membership) => membership.role)
      .sort((left, right) => rolePriority[right] - rolePriority[left])[0] ?? "MEMBER";

  return (
    <div className="dash-page">
      <SettingsControlCenter
        profile={{
          fullName: user.fullName,
          email: user.email,
          role: primaryRole,
        }}
        workspaces={data.workspaces.map((workspace) => {
          const membership = memberships.find((entry) => entry.workspaceId === workspace.id);
          return {
            ...workspace,
            role: membership?.role ?? "MEMBER",
            memberCount: membership?.workspace._count.memberships ?? 0,
          };
        })}
      />
    </div>
  );
}
