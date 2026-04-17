/**
 * In-memory fixed-window rate limiter.
 * Works per-process; for multi-instance deployments swap the store for Redis/Upstash.
 */

type Window = { count: number; resetAt: number };
type RateLimitRule = { bucket: string; limit: number; windowMs: number };

const store = new Map<string, Window>();

function getNumberEnv(name: string, fallback: number) {
  const raw = process.env[name];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getBooleanEnv(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

const isDevelopment = process.env.NODE_ENV === "development";
const relaxInDevelopment = isDevelopment && getBooleanEnv("RATE_LIMIT_RELAX_IN_DEV", true);
const developmentMultiplier = relaxInDevelopment ? getNumberEnv("RATE_LIMIT_DEV_MULTIPLIER", 5) : 1;

function configuredLimit(name: string, fallback: number) {
  return Math.max(1, Math.ceil(getNumberEnv(name, fallback) * developmentMultiplier));
}

// Clean up expired windows every 5 minutes to avoid memory leaks.
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, windowState] of store) {
      if (windowState.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);

  cleanupTimer.unref?.();
}

export type RateLimitResult =
  | { success: true; remaining: number; resetAt: number }
  | { success: false; retryAfterMs: number; resetAt: number };

/**
 * @param key      Unique identifier (e.g. userId, IP, "bucket:userId")
 * @param limit    Maximum requests allowed in the window
 * @param windowMs Window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let windowState = store.get(key);

  if (!windowState || windowState.resetAt < now) {
    windowState = { count: 1, resetAt: now + windowMs };
    store.set(key, windowState);
    return { success: true, remaining: Math.max(0, limit - 1), resetAt: windowState.resetAt };
  }

  if (windowState.count >= limit) {
    return { success: false, retryAfterMs: windowState.resetAt - now, resetAt: windowState.resetAt };
  }

  windowState.count += 1;
  return { success: true, remaining: Math.max(0, limit - windowState.count), resetAt: windowState.resetAt };
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp.trim();

  return "unknown";
}

function buildSubject(request: Request, userId?: string | null, keySuffix?: string) {
  const base = userId ? `user:${userId}` : `ip:${getClientIp(request)}`;
  return keySuffix ? `${base}:${keySuffix}` : base;
}

export const RateLimitPresets = {
  ai: [
    { bucket: "ai-minute", limit: configuredLimit("RATE_LIMIT_AI_PER_MINUTE", 8), windowMs: 60_000 },
    { bucket: "ai-hour", limit: configuredLimit("RATE_LIMIT_AI_PER_HOUR", 30), windowMs: 60 * 60 * 1000 },
  ],
  mutation: [
    { bucket: "mutation-minute", limit: configuredLimit("RATE_LIMIT_MUTATION_PER_MINUTE", 30), windowMs: 60_000 },
  ],
  sensitiveMutation: [
    { bucket: "sensitive-ten-minutes", limit: configuredLimit("RATE_LIMIT_SENSITIVE_PER_10_MINUTES", 20), windowMs: 10 * 60 * 1000 },
  ],
  invite: [
    { bucket: "invite-ten-minutes", limit: configuredLimit("RATE_LIMIT_INVITE_PER_10_MINUTES", 5), windowMs: 10 * 60 * 1000 },
  ],
  read: [
    { bucket: "read-minute", limit: configuredLimit("RATE_LIMIT_READ_PER_MINUTE", 120), windowMs: 60_000 },
  ],
  auth: [
    { bucket: "auth-fifteen-minutes", limit: configuredLimit("RATE_LIMIT_AUTH_PER_15_MINUTES", 20), windowMs: 15 * 60 * 1000 },
  ],
} satisfies Record<string, RateLimitRule[]>;

export function enforceRateLimit(options: {
  request: Request;
  route: string;
  rules: RateLimitRule[];
  userId?: string | null;
  keySuffix?: string;
  message?: string;
}) {
  const subject = buildSubject(options.request, options.userId, options.keySuffix);

  for (const rule of options.rules) {
    const result = rateLimit(`${rule.bucket}:${subject}`, rule.limit, rule.windowMs);
    if (!result.success) {
      console.warn("[rate-limit] blocked request", {
        bucket: rule.bucket,
        route: options.route,
        subject,
        retryAfterMs: result.retryAfterMs,
      });
      return rateLimitResponse(result.retryAfterMs, options.message);
    }
  }

  return null;
}

export function rateLimitResponse(
  retryAfterMs: number,
  message = "Too many requests. Please try again later.",
): Response {
  return Response.json(
    {
      success: false,
      error: message,
      retryAfterMs,
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        "X-RateLimit-Reset": String(Date.now() + retryAfterMs),
      },
    },
  );
}

export function resetRateLimitStore() {
  store.clear();
}
