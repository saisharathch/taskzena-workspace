import test from "node:test";
import assert from "node:assert/strict";

import { buildCursorPage, parseCursorPagination } from "@/lib/pagination";

test("first page returns data and nextCursor when more items exist", () => {
  const items = [{ id: "task-5" }, { id: "task-4" }, { id: "task-3" }, { id: "task-2" }];
  const page = buildCursorPage(items, 3);

  assert.deepEqual(page.data.map((item) => item.id), ["task-5", "task-4", "task-3"]);
  assert.equal(page.nextCursor, "task-3");
});

test("next page returns the remaining items without duplicates", () => {
  const firstRaw = [{ id: "task-5" }, { id: "task-4" }, { id: "task-3" }];
  const secondRaw = [{ id: "task-2" }, { id: "task-1" }];

  const firstPage = buildCursorPage(firstRaw, 2);
  const secondPage = buildCursorPage(secondRaw, 2);
  const combined = [...firstPage.data, ...secondPage.data];

  assert.deepEqual(combined.map((item) => item.id), ["task-5", "task-4", "task-2", "task-1"]);
  assert.equal(new Set(combined.map((item) => item.id)).size, combined.length);
});

test("end of data returns a null nextCursor", () => {
  const page = buildCursorPage([{ id: "task-2" }, { id: "task-1" }], 2);
  assert.equal(page.nextCursor, null);
});

test("cursor parameters are parsed and clamped safely", () => {
  const url = new URL("https://example.com/api/tasks?limit=999&cursor=task-10");
  const result = parseCursorPagination(url, { defaultLimit: 20, maxLimit: 50 });

  assert.equal(result.limit, 50);
  assert.equal(result.cursor, "task-10");
});
