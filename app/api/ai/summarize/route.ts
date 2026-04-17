import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { summarizeTask } from "@/lib/ai";
import { summarizeTaskSchema } from "@/lib/validation/ai";
import { enforceRateLimit, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const limitResponse = enforceRateLimit({
      request,
      route: "ai:summarize",
      rules: RateLimitPresets.ai,
      userId: user.id,
    });
    if (limitResponse) return limitResponse;

    const payload = summarizeTaskSchema.safeParse(await request.json());
    if (!payload.success) {
      return jsonError("Invalid summarize payload.", 400, payload.error.flatten());
    }

    const summary = await summarizeTask(payload.data.taskTitle, payload.data.taskDescription);
    return jsonOk({ summary });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to summarize task.");
  }
}
