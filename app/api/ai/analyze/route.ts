import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { analyzeTask } from "@/lib/ai";
import { Limiters, rateLimitResponse } from "@/lib/rate-limit";
import { analyzeTaskRequestSchema } from "@/lib/validation/ai";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const limit = Limiters.ai(user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

    const body = await request.json().catch(() => null);

    const payload = analyzeTaskRequestSchema.safeParse(body);

    if (!payload.success) {
      return jsonError("Invalid request payload.", 400, payload.error.flatten());
    }

    const analysis = await analyzeTask(
      payload.data.taskTitle,
      payload.data.taskDescription
    );

    return jsonOk({ analysis });
  } catch (error) {
    return jsonErrorFromUnknown(error, "AI analysis failed.");
  }
}
