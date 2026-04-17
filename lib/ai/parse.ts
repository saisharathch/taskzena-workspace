import { z } from "zod";

import { HttpError } from "@/lib/http";

const AI_RESPONSE_ERROR_MESSAGE = "AI response could not be processed. Please try again.";

export class AIResponseProcessingError extends HttpError {
  constructor(message = AI_RESPONSE_ERROR_MESSAGE) {
    super(502, message);
    this.name = "AIResponseProcessingError";
  }
}

function stripCodeFences(raw: string) {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractJsonCandidate(raw: string) {
  const cleaned = stripCodeFences(raw);
  const objectStart = cleaned.indexOf("{");
  const arrayStart = cleaned.indexOf("[");

  let start = -1;
  if (objectStart === -1) start = arrayStart;
  else if (arrayStart === -1) start = objectStart;
  else start = Math.min(objectStart, arrayStart);

  if (start === -1) return cleaned;

  const openChar = cleaned[start];
  const closeChar = openChar === "{" ? "}" : "]";
  const end = cleaned.lastIndexOf(closeChar);

  if (end === -1 || end < start) return cleaned;
  return cleaned.slice(start, end + 1).trim();
}

function logAIParseFailure(label: string, reason: string, raw: string) {
  console.error(`[ai:${label}] ${reason}`, {
    preview: raw.slice(0, 500),
    length: raw.length,
  });
}

export function parseAndValidateAIResponse<T>(
  raw: string,
  schema: z.ZodType<T>,
  label: string,
) {
  const candidate = extractJsonCandidate(raw);

  if (!candidate) {
    logAIParseFailure(label, "Empty AI response.", raw);
    throw new AIResponseProcessingError();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    logAIParseFailure(label, "Malformed JSON returned by AI.", candidate);
    throw new AIResponseProcessingError();
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    logAIParseFailure(label, `Schema validation failed: ${validated.error.message}`, candidate);
    throw new AIResponseProcessingError();
  }

  return validated.data;
}
