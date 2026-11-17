import type { CartItem, OptionGroup, OrderStatus, PaymentStatus } from "./types";

export const SHOP_TIMEZONE = "Asia/Bangkok";

export function formatBaht(value: number): string {
  return `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SHOP_TIMEZONE,
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SHOP_TIMEZONE,
  });
}

export function formatOrderNo(no: number): string {
  return `#${String(no).padStart(4, "0")}`;
}

export const OPTION_GROUP_LABEL: Record<OptionGroup, string> = {
  size: "ขนาด",
  sweetness: "ระดับความหวาน",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระเงินแล้ว",
  preparing: "กำลังเตรียม",
  ready: "พร้อมรับสินค้า",
  completed: "รับสินค้าแล้ว",
  cancelled: "ยกเลิกแล้ว",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-sky-100 text-sky-700",
  preparing: "bg-violet-100 text-violet-700",
  ready: "bg-brand-50 text-brand-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-rose-100 text-rose-700",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "ยังไม่ชำระ",
  reported: "แจ้งชำระแล้ว รอตรวจสอบ",
  paid: "ชำระแล้ว",
};

export function cartUnitPrice(item: Pick<CartItem, "basePrice" | "options">): number {
  return item.basePrice + item.options.reduce((sum, o) => sum + o.priceDelta, 0);
}

export function optionSummary(options: { label: string; group?: OptionGroup }[]): string {
  return options
    .map((o) => (o.group === "sweetness" ? `หวาน ${o.label}` : o.group === "size" ? `ไซซ์ ${o.label}` : o.label))
    .join(" · ");
}
