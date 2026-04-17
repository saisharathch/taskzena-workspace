/**
 * In-memory sliding-window rate limiter.
 * Works per-process; for multi-instance deployments swap the store for Redis/Upstash.
 */

type Window = { count: number; resetAt: number };

const store = new Map<string, Window>();

// Clean up expired windows every 5 minutes to avoid memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store) {
      if (win.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export type RateLimitResult =
  | { success: true; remaining: number }
  | { success: false; retryAfterMs: number };

/**
 * @param key      Unique identifier (e.g. userId, IP, "ip:userId")
 * @param limit    Maximum requests allowed in the window
 * @param windowMs Window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let win = store.get(key);

  if (!win || win.resetAt < now) {
    win = { count: 1, resetAt: now + windowMs };
    store.set(key, win);
    return { success: true, remaining: limit - 1 };
  }

  if (win.count >= limit) {
    return { success: false, retryAfterMs: win.resetAt - now };
  }

  win.count += 1;
  return { success: true, remaining: limit - win.count };
}

/** Pre-configured limiters */
export const Limiters = {
  /** 20 AI calls per user per minute */
  ai: (userId: string) => rateLimit(`ai:${userId}`, 20, 60_000),

  /** 10 task creates per user per minute */
  taskCreate: (userId: string) => rateLimit(`task:${userId}`, 10, 60_000),

  /** 5 invite sends per workspace per 10 minutes */
  invite: (workspaceId: string) => rateLimit(`invite:${workspaceId}`, 5, 600_000),

  /** 10 auth attempts per IP per 15 minutes */
  auth: (ip: string) => rateLimit(`auth:${ip}`, 10, 900_000),
} as const;

/** Helper: turn a rate-limit failure into a 429 Response */
export function rateLimitResponse(retryAfterMs: number): Response {
  return Response.json(
    { success: false, error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        "X-RateLimit-Reset": String(Date.now() + retryAfterMs),
      },
    }
  );
}
