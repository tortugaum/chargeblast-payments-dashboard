import test from "node:test";
import assert from "node:assert/strict";
import { columnKeys, defaultWidths, moveColumn, readColumnLayout } from "../lib/columns.ts";

test("reorders columns without losing any", () => {
  assert.deepEqual(moveColumn([...columnKeys], "amount", "customer"), ["status", "method", "description", "customer", "amount", "created", "id"]);
  assert.deepEqual(moveColumn([...columnKeys], "id", "amount"), ["id", "amount", "status", "method", "description", "customer", "created"]);
});

test("restores safe layouts and rejects invalid data", () => {
  const original = [...columnKeys];
  assert.deepEqual(readColumnLayout("broken"), { order: original, widths: defaultWidths });
  const result = readColumnLayout(JSON.stringify({ order: ["amount", "amount"], widths: { amount: 1, status: 999, id: "large" } }));
  assert.deepEqual(result.order, original);
  assert.equal(result.widths.amount, 90);
  assert.equal(result.widths.status, 500);
  assert.equal(result.widths.id, defaultWidths.id);
});
