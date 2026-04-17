import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { generateSubtasks } from "@/lib/ai";
import { generateSubtasksSchema } from "@/lib/validation/ai";
import { enforceRateLimit, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const limitResponse = enforceRateLimit({
      request,
      route: "ai:subtasks",
      rules: RateLimitPresets.ai,
      userId: user.id,
    });
    if (limitResponse) return limitResponse;

    const payload = generateSubtasksSchema.safeParse(await request.json());
    if (!payload.success) {
      return jsonError("Invalid subtasks payload.", 400, payload.error.flatten());
    }

    const subtasks = await generateSubtasks(payload.data.taskTitle, payload.data.taskDescription);
    return jsonOk({ subtasks });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to generate subtasks.");
  }
}
