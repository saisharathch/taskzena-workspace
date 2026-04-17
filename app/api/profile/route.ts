import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
});

export async function PATCH(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const parsed = updateProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Invalid profile payload.", 400, parsed.error.flatten());
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { fullName: parsed.data.fullName },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    return jsonOk(updated);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update profile.", 500);
  }
}
