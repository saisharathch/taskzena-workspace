export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

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

export function jsonErrorFromUnknown(error: unknown, fallbackMessage: string) {
  if (error instanceof HttpError) {
    return jsonError(error.message, error.status, error.details);
  }

  return jsonError(error instanceof Error ? error.message : fallbackMessage, 500);
}
