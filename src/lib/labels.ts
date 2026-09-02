export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  Paid: "Lunas",
  Unpaid: "Belum Lunas",
  "Partially Paid": "Dibayar Sebagian",
  Cancelled: "Dibatalkan",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  New: "Baru",
  Confirmed: "Dikonfirmasi",
  Processing: "Diproses",
  Ready: "Siap Diambil",
  Completed: "Selesai",
  Cancelled: "Dibatalkan",
};

export const ORDER_STATUS_FLOW = ["New", "Confirmed", "Processing", "Ready", "Completed"] as const;

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABEL[status] ?? status;
}

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}

export const CUSTOMER_TYPE_LABEL: Record<string, string> = {
  New: "Baru",
  Returning: "Pelanggan Tetap",
  Reseller: "Reseller",
  Wholesale: "Grosir",
  Other: "Lainnya",
};

export function customerTypeLabel(type: string): string {
  return CUSTOMER_TYPE_LABEL[type] ?? type;
}

export const COST_LABEL: Record<string, string> = {
  "Material Cost": "Bahan Baku",
  "Labor Cost": "Tenaga Kerja",
  "Packaging Cost": "Kemasan",
  "Other Cost": "Lain-lain",
};

export function costLabel(label: string): string {
  return COST_LABEL[label] ?? label;
}

export type StatusTone = "good" | "warn" | "bad" | "neutral" | "info";

export function paymentStatusTone(status: string): StatusTone {
  if (status === "Paid") return "good";
  if (status === "Partially Paid") return "warn";
  if (status === "Cancelled") return "neutral";
  return "bad";
}

export function orderStatusTone(status: string): StatusTone {
  if (status === "Completed") return "good";
  if (status === "Cancelled") return "neutral";
  if (status === "Ready") return "info";
  return "warn";
}
