import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";
import { analyzeTask } from "@/lib/ai";
import { Limiters, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  taskTitle: z.string().min(1).max(200),
  taskDescription: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const limit = Limiters.ai(user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

    const body = await request.json().catch(() => null);

    const payload = schema.safeParse(body);

    if (!payload.success) {
      return jsonError("Invalid request payload.", 400, payload.error.flatten());
    }

    const analysis = await analyzeTask(
      payload.data.taskTitle,
      payload.data.taskDescription
    );

    return jsonOk({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI analysis failed.";
    return jsonError(message, 500);
  }
}
