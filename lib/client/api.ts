type ApiErrorPayload = {
  error?: string;
  message?: string;
  retryAfterMs?: number;
};

export function getApiErrorMessage(
  response: Response,
  payload: ApiErrorPayload | null | undefined,
  fallback: string,
) {
  if (response.status === 429) {
    return payload?.error ?? "Too many requests. Please try again later.";
  }

  return payload?.error ?? payload?.message ?? fallback;
}
