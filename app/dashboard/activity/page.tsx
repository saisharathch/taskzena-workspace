import { requireAppUser } from "@/lib/auth/session";
import { getWorkspaceActivityFeed } from "@/lib/activity/server";
import { prisma } from "@/lib/db/prisma";
import { WorkspaceActivityFeed } from "@/components/features/activity/WorkspaceActivityFeed";
import { PageIntro } from "@/components/layout/PageIntro";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    workspaceId?: string;
    eventType?: "all" | "task" | "comment" | "project" | "workspace" | "member";
    actorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const user = await requireAppUser();
  const sp = await searchParams;
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const workspaces = memberships.map((membership) => ({
    id: membership.workspaceId,
    name: membership.workspace.name,
  }));

  const selectedWorkspaceId =
    workspaces.find((workspace) => workspace.id === sp.workspaceId)?.id ?? workspaces[0]?.id ?? "";

  const initialFeed = selectedWorkspaceId
    ? await getWorkspaceActivityFeed({
        userId: user.id,
        workspaceId: selectedWorkspaceId,
        limit: 20,
        eventType: sp.eventType ?? "all",
        actorId: sp.actorId,
        dateFrom: sp.dateFrom,
        dateTo: sp.dateTo,
      })
    : { data: [], nextCursor: null, actors: [] };

  return (
    <div className="dash-page">
      <PageIntro
        eyebrow="Activity"
        title="Workspace activity feed"
        description="Follow team movement, comments, task updates, and project events in one timeline."
      />
      <WorkspaceActivityFeed
        workspaces={workspaces}
        initialWorkspaceId={selectedWorkspaceId}
        initialItems={initialFeed.data}
        initialNextCursor={initialFeed.nextCursor}
        initialActors={initialFeed.actors}
        initialEventType={sp.eventType ?? "all"}
        initialActorId={sp.actorId ?? ""}
        initialDateFrom={sp.dateFrom ?? ""}
        initialDateTo={sp.dateTo ?? ""}
      />
    </div>
  );
}
