import { getApiUser } from "@/lib/auth/session";
import { ACTIVITY_EVENT_TYPE_OPTIONS, type ActivityEventType } from "@/lib/activity";
import { getWorkspaceActivityFeed } from "@/lib/activity/server";
import { prisma } from "@/lib/db/prisma";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { buildCursorPage } from "@/lib/pagination";
import { parseCursorPagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const url = new URL(request.url);
    const { limit, cursor } = parseCursorPagination(url, { defaultLimit: 20, maxLimit: 100 });
    const workspaceId = url.searchParams.get("workspaceId") ?? url.searchParams.get("workspace");
    const actorId = url.searchParams.get("actorId") || undefined;
    const eventType = (url.searchParams.get("eventType") || "all") as ActivityEventType;
    const dateFrom = url.searchParams.get("dateFrom") || undefined;
    const dateTo = url.searchParams.get("dateTo") || undefined;
    const format = url.searchParams.get("format");

    if (format === "feed") {
      if (!workspaceId) {
        return jsonError("A workspace is required to view activity.", 400);
      }

      const feed = await getWorkspaceActivityFeed({
        userId: user.id,
        workspaceId,
        limit,
        cursor,
        actorId,
        eventType,
        dateFrom,
        dateTo,
      });

      return jsonOk({
        data: feed.data,
        nextCursor: feed.nextCursor,
        filters: {
          actors: feed.actors,
          eventTypes: ACTIVITY_EVENT_TYPE_OPTIONS,
        },
      });
    }

    const action = url.searchParams.get("action") || undefined;
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      select: { workspaceId: true },
    });
    const workspaceIds = memberships.map((membership) => membership.workspaceId);

    const logs = await prisma.activityLog.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        ...(workspaceId ? { workspaceId } : {}),
        ...(action ? { action } : {}),
      },
      select: {
        id: true,
        action: true,
        createdAt: true,
        actor: { select: { fullName: true, email: true } },
        task: { select: { title: true } },
        workspace: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return jsonOk(buildCursorPage(logs, limit));
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to fetch activity logs.");
  }
}
