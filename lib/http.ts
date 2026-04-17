export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json(
    {
      success: false,
      error: message,
      details
    },
    { status }
  );
}
