import test from "node:test";
import assert from "node:assert/strict";

import { parseAndValidateAIResponse, AIResponseProcessingError } from "@/lib/ai/parse";
import {
  aiSubtasksResponseSchema,
  aiTaskSummaryResponseSchema,
} from "@/lib/ai/schemas";

test("valid AI JSON response passes schema validation", () => {
  const result = parseAndValidateAIResponse(
    '{"summary":"- bullet 1\\n- bullet 2\\n- bullet 3"}',
    aiTaskSummaryResponseSchema,
    "summary",
  );

  assert.equal(result.summary, "- bullet 1\n- bullet 2\n- bullet 3");
});

test("markdown-wrapped JSON is cleaned and validated", () => {
  const result = parseAndValidateAIResponse(
    '```json\n{"subtasks":["First task","Second task"]}\n```',
    aiSubtasksResponseSchema,
    "subtasks",
  );

  assert.deepEqual(result.subtasks, ["First task", "Second task"]);
});

test("malformed JSON fails gracefully", () => {
  assert.throws(
    () => parseAndValidateAIResponse('{"summary":"missing brace"', aiTaskSummaryResponseSchema, "summary"),
    (error: unknown) =>
      error instanceof AIResponseProcessingError &&
      error.status === 502 &&
      error.message === "AI response could not be processed. Please try again.",
  );
});

test("wrong schema fails gracefully", () => {
  assert.throws(
    () =>
      parseAndValidateAIResponse(
        '{"summary":123}',
        aiTaskSummaryResponseSchema,
        "summary",
      ),
    (error: unknown) => error instanceof AIResponseProcessingError,
  );
});

test("empty response fails gracefully", () => {
  assert.throws(
    () => parseAndValidateAIResponse("", aiTaskSummaryResponseSchema, "summary"),
    (error: unknown) => error instanceof AIResponseProcessingError,
  );
});
