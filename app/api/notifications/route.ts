import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";

/** GET /api/notifications — list recent notifications for current user */
export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          read: true,
          linkHref: true,
          taskId: true,
          workspaceId: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);

    return jsonOk({ notifications, unreadCount });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch notifications.", 500);
  }
}

/** PATCH /api/notifications — mark ALL as read */
export async function PATCH() {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update notifications.", 500);
  }
}
