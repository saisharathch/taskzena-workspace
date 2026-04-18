export type CursorPage<T> = {
  data: T[];
  nextCursor: string | null;
};

export function parseCursorPagination(
  request: Request | URL,
  options?: { defaultLimit?: number; maxLimit?: number },
) {
  const url = request instanceof URL ? request : new URL(request.url);
  const defaultLimit = options?.defaultLimit ?? 20;
  const maxLimit = options?.maxLimit ?? 100;
  const rawLimit = Number(url.searchParams.get("limit") ?? defaultLimit);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), maxLimit) : defaultLimit;
  const cursor = url.searchParams.get("cursor") || undefined;

  return { limit, cursor };
}

export function buildCursorPage<T extends { id: string }>(items: T[], limit: number): CursorPage<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

  return { data, nextCursor };
}
