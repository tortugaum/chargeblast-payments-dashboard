import test from "node:test";
import assert from "node:assert/strict";
import { createPayments, initialFilters, selectPayments } from "../lib/payments.ts";

const now = new Date("2026-11-24T12:00:00Z");
const payments = createPayments(now);
const sort = { key: "created", direction: "desc" };
const select = (filters = {}, order = sort) => selectPayments(payments, { ...initialFilters, ...filters }, order, now);

test("generates reproducible and varied data", () => {
  assert.equal(payments.length, 500);
  assert.deepEqual(payments, createPayments(now));
  assert.equal(new Set(payments.map((payment) => payment.id)).size, 500);
  assert.equal(new Set(payments.map((payment) => payment.status)).size, 4);
  assert.equal(new Set(payments.map((payment) => payment.currency)).size, 4);
});

test("searches IDs, emails and last four digits", () => {
  const sample = payments[0];
  for (const term of [sample.id, sample.email.toUpperCase(), sample.last4]) {
    assert.ok(select({ search: term }).some((payment) => payment.id === sample.id));
  }
  assert.equal(select({ search: "not-a-payment" }).length, 0);
});

test("combines status, method and amount filters", () => {
  const result = select({ statuses: ["Succeeded", "Pending"], methods: ["Card"], min: "10", max: "100" });
  assert.ok(result.length > 0);
  assert.ok(result.every((p) => ["Succeeded", "Pending"].includes(p.status) && p.method === "Card" && p.amount >= 1000 && p.amount <= 10000));
});

test("date presets and custom ranges select matching dates", () => {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const today = select({ date: "today" });
  assert.ok(today.length > 0);
  assert.ok(today.every((p) => new Date(p.created) >= start));
  assert.ok(select({ date: "7" }).length >= today.length);
  assert.ok(select({ date: "30" }).length >= select({ date: "7" }).length);
  assert.equal(select({ date: "custom", from: "2000-01-01", to: "2000-01-02" }).length, 0);
});

test("sorts amount, status, and dates in both directions", () => {
  for (const key of ["amount", "status", "created"]) {
    for (const direction of ["asc", "desc"]) {
      const result = select({}, { key, direction });
      for (let i = 1; i < result.length; i++) {
        const a = result[i - 1][key], b = result[i][key];
        const comparison = typeof a === "number" ? a - b : a.localeCompare(b);
        assert.ok(direction === "asc" ? comparison <= 0 : comparison >= 0);
      }
    }
  }
});
