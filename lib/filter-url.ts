import { initialFilters, methods, statuses, type Filters, type Method, type Status } from "./payments.ts";

const keys = ["q", "date", "from", "to", "status", "method", "min", "max"];
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const validAmount = (value: string) => /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(value) && Number.isFinite(Number(value));

export function filtersFromSearch(search: string): Filters {
  const params = new URLSearchParams(search);
  const date = params.get("date") || "all";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const min = params.get("min") || "";
  const max = params.get("max") || "";
  return {
    ...initialFilters,
    search: (params.get("q") || "").slice(0, 200),
    date: ["all", "today", "7", "30", "custom"].includes(date) ? date : "all",
    from: validDate(from) ? from : "", to: validDate(to) ? to : "",
    statuses: Array.from(new Set(params.getAll("status").filter((value): value is Status => statuses.includes(value as Status)))),
    methods: Array.from(new Set(params.getAll("method").filter((value): value is Method => methods.includes(value as Method)))),
    min: validAmount(min) ? min : "", max: validAmount(max) ? max : "",
  };
}

export function searchFromFilters(filters: Filters, currentSearch = ""): string {
  const params = new URLSearchParams(currentSearch);
  keys.forEach((key) => params.delete(key));
  if (filters.search) params.set("q", filters.search);
  if (filters.date !== "all") params.set("date", filters.date);
  if (filters.date === "custom" && filters.from) params.set("from", filters.from);
  if (filters.date === "custom" && filters.to) params.set("to", filters.to);
  filters.statuses.forEach((status) => params.append("status", status));
  filters.methods.forEach((method) => params.append("method", method));
  if (filters.min && validAmount(filters.min)) params.set("min", filters.min);
  if (filters.max && validAmount(filters.max)) params.set("max", filters.max);
  const result = params.toString();
  return result ? `?${result}` : "";
}
