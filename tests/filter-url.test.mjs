import test from "node:test";
import assert from "node:assert/strict";
import { filtersFromSearch, searchFromFilters } from "../lib/filter-url.ts";
import { initialFilters } from "../lib/payments.ts";

test("round trips a complete shared filter set", () => {
  const filters = { ...initialFilters, search: "hello+test@example.com", date: "custom", from: "2026-01-01", to: "2026-02-01", statuses: ["Succeeded", "Pending"], methods: ["Card", "Wallet"], min: "10.50", max: "200" };
  assert.deepEqual(filtersFromSearch(searchFromFilters(filters)), filters);
});

test("ignores invalid values and duplicate selections", () => {
  const filters = filtersFromSearch("?date=bad&from=2026-02-30&min=-1&max=abc&status=Failed&status=Failed&status=Invalid&method=ACH&method=Invalid");
  assert.equal(filters.date, "all");
  assert.equal(filters.from, "");
  assert.equal(filters.min, "");
  assert.equal(filters.max, "");
  assert.deepEqual(filters.statuses, ["Failed"]);
  assert.deepEqual(filters.methods, ["ACH"]);
});

test("preserves unrelated parameters and removes cleared filters", () => {
  assert.equal(searchFromFilters(initialFilters, "?campaign=demo&q=old&status=Failed"), "?campaign=demo");
  assert.equal(searchFromFilters(initialFilters), "");
});
