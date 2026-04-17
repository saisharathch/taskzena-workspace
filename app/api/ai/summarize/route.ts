import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";
import { summarizeTask } from "@/lib/ai";
import { summarizeTaskSchema } from "@/lib/validation/ai";
import { Limiters, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const limit = Limiters.ai(user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

    const payload = summarizeTaskSchema.safeParse(await request.json());
    if (!payload.success) {
      return jsonError("Invalid summarize payload.", 400, payload.error.flatten());
    }

    const summary = await summarizeTask(payload.data.taskTitle, payload.data.taskDescription);
    return jsonOk({ summary });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to summarize task.", 500);
  }
}
