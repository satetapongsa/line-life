/** ค่าคงที่ของร้าน ใช้ร่วมกันทั้ง client และ server */

export const SHOP_NAME = "Wave Shop";
export const OPEN_HOUR = 8; // 08:00
export const CLOSE_HOUR = 20; // 20:00 (รับสินค้าได้ถึง 19:45)
export const SLOT_MINUTES = 15;
export const MIN_PREP_MINUTES = 15;
export const MAX_ADVANCE_HOURS = 24;
export const MAX_ITEMS_PER_ORDER = 30;
export const MAX_QTY_PER_ITEM = 20;
export const ORDER_NOTE_MAX = 200;
export const ITEM_NOTE_MAX = 100;

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** ชั่วโมงตามเวลาไทย (ไม่ขึ้นกับ timezone ของเครื่อง) */
export function bangkokHour(date: Date): number {
  return new Date(date.getTime() + BKK_OFFSET_MS).getUTCHours();
}

export function isWithinOpeningHours(date: Date): boolean {
  const h = bangkokHour(date);
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

/** สร้างช่วงเวลารับสินค้าที่เลือกได้ (ทุก 15 นาที ภายในเวลาเปิดร้าน ล่วงหน้าไม่เกิน 24 ชม.) */
export function pickupSlots(now = new Date()): Date[] {
  const step = SLOT_MINUTES * 60_000;
  const start = Math.ceil((now.getTime() + MIN_PREP_MINUTES * 60_000) / step) * step;
  const end = now.getTime() + MAX_ADVANCE_HOURS * 3_600_000;
  const slots: Date[] = [];
  for (let t = start; t <= end; t += step) {
    const d = new Date(t);
    if (isWithinOpeningHours(d)) slots.push(d);
  }
  return slots;
}
