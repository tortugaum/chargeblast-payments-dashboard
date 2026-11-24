export const statuses = ["Succeeded", "Pending", "Failed", "Refunded"] as const;
export const methods = ["Card", "ACH", "Wallet"] as const;
export type Status = (typeof statuses)[number];
export type Method = (typeof methods)[number];
export type Payment = {
  id: string; email: string; amount: number; currency: "USD" | "GBP" | "EUR" | "BRL";
  status: Status; method: Method; brand: string; last4: string; created: string;
};
export type Filters = { search: string; date: string; from: string; to: string; statuses: Status[]; methods: Method[]; min: string; max: string };
export type Sort = { key: "created" | "amount" | "status"; direction: "asc" | "desc" };
export const initialFilters: Filters = { search: "", date: "all", from: "", to: "", statuses: [], methods: [], min: "", max: "" };

// Fixed seed makes the sample stable across renders and deployments. Dates are
// relative to a single captured clock so the preset filters remain useful.
export function createPayments(now: Date): Payment[] {
  const first = ["alex", "sarah", "jordan", "taylor", "morgan", "chris", "sam", "jamie", "olivia", "lucas", "isabella", "daniel"];
  const last = ["silva", "chen", "martin", "rodriguez", "wilson", "brown", "santos", "lee", "thompson", "garcia"];
  const currencies = ["USD", "USD", "USD", "GBP", "EUR", "BRL"] as const;
  const brands = ["Visa", "Mastercard", "Amex"];
  let seed = 39483;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  return Array.from({ length: 500 }, (_, i) => {
    const method = methods[Math.floor(random() * methods.length)];
    const statusRoll = random();
    const status: Status = statusRoll < .67 ? "Succeeded" : statusRoll < .78 ? "Pending" : statusRoll < .94 ? "Failed" : "Refunded";
    const age = i < 25 ? random() * 0.8 : random() * 110;
    return {
      id: `pi_${Array.from({ length: 24 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(random() * 62)]).join("")}`,
      email: `${first[Math.floor(random() * first.length)]}.${last[Math.floor(random() * last.length)]}${Math.floor(random() * 90 + 10)}@${["gmail.com", "outlook.com", "icloud.com"][Math.floor(random() * 3)]}`,
      amount: Math.round((4 + random() * 245) * 100), currency: currencies[Math.floor(random() * currencies.length)], status, method,
      brand: method === "Card" ? brands[Math.floor(random() * brands.length)] : method === "Wallet" ? "Apple Pay" : "Bank account",
      last4: String(Math.floor(random() * 10000)).padStart(4, "0"),
      created: new Date(now.getTime() - age * 86400000).toISOString(),
    };
  });
}

export function selectPayments(payments: Payment[], filters: Filters, sort: Sort, now: Date): Payment[] {
  const query = filters.search.trim().toLowerCase();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (filters.date === "7") start.setDate(start.getDate() - 6);
  if (filters.date === "30") start.setDate(start.getDate() - 29);
  const customStart = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : -Infinity;
  const customEnd = filters.to ? new Date(`${filters.to}T23:59:59.999`).getTime() : Infinity;
  return payments.filter((payment) => {
    const date = new Date(payment.created).getTime();
    return (!query || [payment.id, payment.email, payment.last4].some((value) => value.toLowerCase().includes(query))) &&
      (filters.date === "all" || (filters.date === "custom" ? date >= customStart && date <= customEnd : date >= start.getTime() && date <= now.getTime())) &&
      (!filters.statuses.length || filters.statuses.includes(payment.status)) &&
      (!filters.methods.length || filters.methods.includes(payment.method)) &&
      (filters.min === "" || payment.amount >= Number(filters.min) * 100) &&
      (filters.max === "" || payment.amount <= Number(filters.max) * 100);
  }).sort((a, b) => {
    const comparison = sort.key === "amount" ? a.amount - b.amount : sort.key === "created" ? Date.parse(a.created) - Date.parse(b.created) : a.status.localeCompare(b.status);
    return comparison * (sort.direction === "asc" ? 1 : -1) || a.id.localeCompare(b.id);
  });
}

export function formatAmount(payment: Payment) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: payment.currency }).format(payment.amount / 100);
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(date));
}
export function relativeDate(date: string, now: Date) {
  const seconds = Math.round((new Date(date).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const [value, unit]: [number, Intl.RelativeTimeFormatUnit] = abs < 60 ? [seconds, "second"] : abs < 3600 ? [Math.round(seconds / 60), "minute"] : abs < 86400 ? [Math.round(seconds / 3600), "hour"] : [Math.round(seconds / 86400), "day"];
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(value, unit);
}
