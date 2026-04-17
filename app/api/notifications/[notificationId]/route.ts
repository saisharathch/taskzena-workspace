import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";

/** PATCH /api/notifications/[notificationId] — mark single notification as read */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { notificationId } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notification) return jsonError("Not found.", 404);
    if (notification.userId !== user.id) return jsonError("Forbidden.", 403);

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update notification.", 500);
  }
}
