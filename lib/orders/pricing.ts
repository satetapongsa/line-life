import "server-only";

import { mapProductRow, PRODUCT_SELECT } from "../catalog";
import { ApiError, isUuid } from "../http";
import {
  isWithinOpeningHours,
  ITEM_NOTE_MAX,
  MAX_ADVANCE_HOURS,
  MAX_ITEMS_PER_ORDER,
  MAX_QTY_PER_ITEM,
  ORDER_NOTE_MAX,
} from "../shop";
import { getServiceSupabase } from "../supabase/server";
import type { OptionGroup, Product } from "../types";

/** สิ่งที่ client ส่งมาได้: แค่ "เลือกอะไร" ไม่มีราคา ไม่มี userId */
export type OrderRequest = {
  items: { productId: string; optionIds: string[]; quantity: number; note?: string }[];
  pickupTime: string;
  note?: string;
};

export type PricedItem = {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  options: { group: OptionGroup; label: string; price_delta: number }[];
  note: string | null;
  line_total: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function cleanText(v: unknown, max: number): string | null {
  if (v == null) return null;
  if (typeof v !== "string") throw new ApiError(400, "รูปแบบข้อมูลไม่ถูกต้อง");
  const s = v.trim();
  if (s.length > max) throw new ApiError(400, `หมายเหตุยาวเกิน ${max} ตัวอักษร`);
  return s || null;
}

export function parseOrderRequest(body: unknown): OrderRequest {
  const b = body as Partial<OrderRequest> | null;
  if (!b || !Array.isArray(b.items) || b.items.length === 0) {
    throw new ApiError(400, "ตะกร้าว่าง กรุณาเลือกสินค้าก่อน");
  }
  if (b.items.length > MAX_ITEMS_PER_ORDER) {
    throw new ApiError(400, `สั่งได้ไม่เกิน ${MAX_ITEMS_PER_ORDER} รายการต่อออเดอร์`);
  }
  const items = b.items.map((i) => {
    if (
      !i ||
      !isUuid(i.productId) ||
      !Array.isArray(i.optionIds) ||
      !i.optionIds.every(isUuid) ||
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > MAX_QTY_PER_ITEM
    ) {
      throw new ApiError(400, "ข้อมูลสินค้าในตะกร้าไม่ถูกต้อง กรุณาล้างตะกร้าแล้วลองใหม่");
    }
    return {
      productId: i.productId,
      optionIds: [...new Set(i.optionIds)],
      quantity: i.quantity,
      note: cleanText(i.note, ITEM_NOTE_MAX) ?? undefined,
    };
  });
  if (typeof b.pickupTime !== "string") throw new ApiError(400, "กรุณาเลือกเวลามารับสินค้า");
  return { items, pickupTime: b.pickupTime, note: cleanText(b.note, ORDER_NOTE_MAX) ?? undefined };
}

export function validatePickupTime(iso: string, now = new Date()): Date {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) throw new ApiError(400, "เวลามารับสินค้าไม่ถูกต้อง");
  const diff = t.getTime() - now.getTime();
  // เผื่อเวลาให้ผู้ใช้ที่เปิดหน้า checkout ค้างไว้นานเล็กน้อย
  if (diff < 5 * 60_000) throw new ApiError(400, "เวลามารับต้องอยู่หลังจากนี้อย่างน้อย 15 นาที กรุณาเลือกใหม่");
  if (diff > (MAX_ADVANCE_HOURS + 1) * 3_600_000) throw new ApiError(400, "สั่งล่วงหน้าได้ไม่เกิน 24 ชั่วโมง");
  if (!isWithinOpeningHours(t)) throw new ApiError(400, "เวลาที่เลือกอยู่นอกเวลาเปิดร้าน (08:00–20:00)");
  return t;
}

/**
 * คำนวณราคาใหม่ทั้งหมดจากฐานข้อมูล ราคาจาก client จะไม่ถูกใช้เลย
 * - สินค้าต้องมีอยู่จริงและเปิดขาย
 * - ตัวเลือกต้องเป็นของสินค้านั้น และเลือกได้กลุ่มละ 1 ตัว (ไม่เลือก = ใช้ค่า default)
 */
export async function priceOrder(req: OrderRequest): Promise<{ items: PricedItem[]; total: number }> {
  const ids = [...new Set(req.items.map((i) => i.productId))];
  const { data, error } = await getServiceSupabase()
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids);
  if (error) throw error;

  const products = new Map<string, Product>(data.map((row) => [row.id, mapProductRow(row)]));

  const items = req.items.map<PricedItem>((item) => {
    const product = products.get(item.productId);
    if (!product) throw new ApiError(400, "มีสินค้าบางรายการไม่มีในร้านแล้ว กรุณาลบออกจากตะกร้า");
    if (!product.is_available) throw new ApiError(409, `ขออภัย ${product.name} หมดชั่วคราว`);

    const chosen = item.optionIds.map((id) => {
      const opt = product.options.find((o) => o.id === id);
      if (!opt) throw new ApiError(400, `ตัวเลือกของ ${product.name} ไม่ถูกต้อง`);
      return opt;
    });

    const groups = new Set(product.options.map((o) => o.group_name));
    const finalOptions = [...groups].map((group) => {
      const picked = chosen.filter((o) => o.group_name === group);
      if (picked.length > 1) throw new ApiError(400, `เลือกตัวเลือกของ ${product.name} ได้กลุ่มละ 1 อย่าง`);
      return (
        picked[0] ??
        product.options.find((o) => o.group_name === group && o.is_default) ??
        product.options.find((o) => o.group_name === group)!
      );
    });

    const unit = round2(product.price + finalOptions.reduce((s, o) => s + o.price_delta, 0));
    return {
      product_id: product.id,
      product_name: product.name,
      unit_price: unit,
      quantity: item.quantity,
      options: finalOptions.map((o) => ({ group: o.group_name, label: o.label, price_delta: o.price_delta })),
      note: item.note ?? null,
      line_total: round2(unit * item.quantity),
    };
  });

  return { items, total: round2(items.reduce((s, i) => s + i.line_total, 0)) };
}
