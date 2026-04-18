import { prisma } from "@/lib/db/prisma";
import { buildCursorPage } from "@/lib/pagination";
import { requireWorkspaceMembership } from "@/lib/auth/authorization";
import {
  ACTIVITY_ACTIONS_BY_EVENT_TYPE,
  type ActivityActorOption,
  type ActivityEventType,
  formatActivityItem,
} from "@/lib/activity";

type ActivityQuery = {
  userId: string;
  workspaceId: string;
  limit: number;
  cursor?: string;
  eventType?: ActivityEventType;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
};

function parseDateStart(dateFrom?: string) {
  if (!dateFrom) return undefined;
  return new Date(`${dateFrom}T00:00:00.000Z`);
}

function parseDateEnd(dateTo?: string) {
  if (!dateTo) return undefined;
  return new Date(`${dateTo}T23:59:59.999Z`);
}

export async function getWorkspaceActivityFeed({
  userId,
  workspaceId,
  limit,
  cursor,
  actorId,
  eventType,
  dateFrom,
  dateTo,
}: ActivityQuery) {
  await requireWorkspaceMembership(userId, workspaceId);

  const where = {
    workspaceId,
    ...(actorId ? { actorId } : {}),
    ...(eventType && eventType !== "all"
      ? { action: { in: ACTIVITY_ACTIONS_BY_EVENT_TYPE[eventType] } }
      : {}),
    ...((dateFrom || dateTo)
      ? {
          createdAt: {
            ...(dateFrom ? { gte: parseDateStart(dateFrom) } : {}),
            ...(dateTo ? { lte: parseDateEnd(dateTo) } : {}),
          },
        }
      : {}),
  };

  const [logs, actorRows] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        createdAt: true,
        metadata: true,
        actor: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, title: true } },
        workspace: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.activityLog.findMany({
      where: {
        workspaceId,
        actorId: { not: null },
      },
      select: {
        actorId: true,
        actor: { select: { fullName: true, email: true } },
      },
      distinct: ["actorId"],
      orderBy: { actorId: "asc" },
    }),
  ]);

  const page = buildCursorPage(logs, limit);
  const actors: ActivityActorOption[] = actorRows
    .filter((row): row is typeof row & { actorId: string; actor: NonNullable<typeof row.actor> } => Boolean(row.actorId && row.actor))
    .map((row) => ({
      id: row.actorId,
      label: row.actor.fullName ?? row.actor.email ?? "Unknown user",
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  return {
    data: page.data.map(formatActivityItem),
    nextCursor: page.nextCursor,
    actors,
  };
}
