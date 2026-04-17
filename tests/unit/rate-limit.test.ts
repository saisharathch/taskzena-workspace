import test from "node:test";
import assert from "node:assert/strict";

import {
  enforceRateLimit,
  RateLimitPresets,
  rateLimitResponse,
  resetRateLimitStore,
} from "@/lib/rate-limit";

function buildRequest() {
  return new Request("https://example.com/api/test", {
    headers: {
      "x-forwarded-for": "203.0.113.10",
    },
  });
}

test.beforeEach(() => {
  resetRateLimitStore();
});

test("normal requests below the limit succeed", () => {
  const request = buildRequest();

  const first = enforceRateLimit({
    request,
    route: "tests:mutation",
    rules: [{ bucket: "test-mutation", limit: 2, windowMs: 60_000 }],
    userId: "user-1",
  });
  const second = enforceRateLimit({
    request,
    route: "tests:mutation",
    rules: [{ bucket: "test-mutation", limit: 2, windowMs: 60_000 }],
    userId: "user-1",
  });

  assert.equal(first, null);
  assert.equal(second, null);
});

test("repeated requests exceed the configured limit", () => {
  const request = buildRequest();

  enforceRateLimit({
    request,
    route: "tests:mutation",
    rules: [{ bucket: "test-mutation", limit: 2, windowMs: 60_000 }],
    userId: "user-1",
  });
  enforceRateLimit({
    request,
    route: "tests:mutation",
    rules: [{ bucket: "test-mutation", limit: 2, windowMs: 60_000 }],
    userId: "user-1",
  });

  const blocked = enforceRateLimit({
    request,
    route: "tests:mutation",
    rules: [{ bucket: "test-mutation", limit: 2, windowMs: 60_000 }],
    userId: "user-1",
  });

  assert.ok(blocked instanceof Response);
  assert.equal(blocked.status, 429);
});

test("AI limits are stricter than normal mutation limits", () => {
  const request = buildRequest();

  let aiBlockedAt = -1;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const blocked = enforceRateLimit({
      request,
      route: "tests:ai",
      rules: RateLimitPresets.ai,
      userId: "user-ai",
    });

    if (blocked) {
      aiBlockedAt = attempt;
      break;
    }
  }

  let mutationBlockedAt = -1;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const blocked = enforceRateLimit({
      request,
      route: "tests:mutation",
      rules: RateLimitPresets.mutation,
      userId: "user-mutation",
    });

    if (blocked) {
      mutationBlockedAt = attempt;
      break;
    }
  }

  assert.ok(aiBlockedAt > 0, "AI preset should block within 12 requests.");
  assert.equal(mutationBlockedAt, -1, "Mutation preset should still allow 12 requests.");
});

test("429 response shape is consistent", async () => {
  const response = rateLimitResponse(15_000);
  const body = await response.json();

  assert.equal(response.status, 429);
  assert.equal(body.success, false);
  assert.equal(body.code, "RATE_LIMITED");
  assert.equal(body.error, "Too many requests. Please try again later.");
  assert.equal(body.retryAfterMs, 15_000);
  assert.ok(response.headers.get("Retry-After"));
});
