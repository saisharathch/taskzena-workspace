import { getApiUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";
import { parseNaturalLanguageTasks } from "@/lib/ai";
import { Limiters, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  input: z.string().min(5).max(500),
});

/** POST /api/ai/parse-tasks — convert natural language to structured task list */
export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const limit = Limiters.ai(user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

    const body    = schema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError("Invalid payload.", 400, body.error.flatten());

    const tasks = await parseNaturalLanguageTasks(body.data.input);
    return jsonOk({ tasks });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to parse tasks.", 500);
  }
}
