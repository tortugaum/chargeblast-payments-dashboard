export const columnKeys = ["amount", "status", "method", "description", "customer", "created", "id"] as const;
export type ColumnKey = (typeof columnKeys)[number];
export const columnLabels: Record<ColumnKey, string> = { amount: "Amount", status: "Status", method: "Payment method", description: "Description", customer: "Customer", created: "Date", id: "Payment ID" };
export const defaultWidths: Record<ColumnKey, number> = { amount: 140, status: 115, method: 160, description: 160, customer: 235, created: 185, id: 190 };
export const minWidth = 90;
export const maxWidth = 500;

export function moveColumn(order: ColumnKey[], from: ColumnKey, to: ColumnKey): ColumnKey[] {
  const source = order.indexOf(from), target = order.indexOf(to);
  if (source < 0 || target < 0 || source === target) return order;
  const next = [...order]; next.splice(source, 1); next.splice(target, 0, from); return next;
}

export function readColumnLayout(value: string | null): { order: ColumnKey[]; widths: Record<ColumnKey, number> } {
  try {
    const saved = JSON.parse(value || "null");
    const order = Array.isArray(saved?.order) && saved.order.length === columnKeys.length && new Set(saved.order).size === columnKeys.length && saved.order.every((key: string) => columnKeys.includes(key as ColumnKey)) ? saved.order as ColumnKey[] : [...columnKeys];
    const widths = { ...defaultWidths };
    for (const key of columnKeys) if (typeof saved?.widths?.[key] === "number" && Number.isFinite(saved.widths[key])) widths[key] = Math.max(minWidth, Math.min(maxWidth, Math.round(saved.widths[key])));
    return { order, widths };
  } catch { return { order: [...columnKeys], widths: { ...defaultWidths } }; }
}
