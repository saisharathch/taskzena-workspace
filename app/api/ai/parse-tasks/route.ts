import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonErrorFromUnknown, jsonOk } from "@/lib/http";
import { parseNaturalLanguageTasks } from "@/lib/ai";
import { enforceRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { parseTasksRequestSchema } from "@/lib/validation/ai";

/** POST /api/ai/parse-tasks — convert natural language to structured task list */
export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const limitResponse = enforceRateLimit({
      request,
      route: "ai:parse-tasks",
      rules: RateLimitPresets.ai,
      userId: user.id,
    });
    if (limitResponse) return limitResponse;

    const body = parseTasksRequestSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError("Invalid payload.", 400, body.error.flatten());

    const tasks = await parseNaturalLanguageTasks(body.data.input);
    return jsonOk({ tasks });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to parse tasks.");
  }
}
