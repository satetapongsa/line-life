import "server-only";

import { ApiError, isUuid } from "../http";
import { getServiceSupabase } from "../supabase/server";
import type { Order, OrderItem, OrderStatus } from "../types";

export const ORDER_SELECT =
  "id, order_no, line_user_id, display_name, status, payment_status, total, pickup_time, note, created_at, updated_at, order_items(id, product_id, product_name, unit_price, quantity, options, note, line_total)";

type OrderRow = Omit<Order, "items" | "total"> & {
  total: number | string;
  order_items: (Omit<OrderItem, "unit_price" | "line_total"> & {
    unit_price: number | string;
    line_total: number | string;
  })[];
};

export function mapOrderRow(row: OrderRow): Order {
  const { order_items, ...rest } = row;
  return {
    ...rest,
    total: Number(row.total),
    items: (order_items ?? []).map((i) => ({
      ...i,
      unit_price: Number(i.unit_price),
      line_total: Number(i.line_total),
    })),
  };
}

/** ดึงออเดอร์ โดยเช็คว่าเป็นของผู้ใช้คนนั้นจริง (หรือเป็นแอดมิน) */
export async function getOrderFor(
  id: string,
  viewer: { userId: string; admin?: boolean }
): Promise<Order> {
  if (!isUuid(id)) throw new ApiError(404, "ไม่พบออเดอร์นี้");
  let query = getServiceSupabase().from("orders").select(ORDER_SELECT).eq("id", id);
  if (!viewer.admin) query = query.eq("line_user_id", viewer.userId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  // ตอบ 404 เหมือนกันทั้งกรณีไม่มีจริงและไม่ใช่เจ้าของ เพื่อไม่ให้เดา id ของคนอื่นได้
  if (!data) throw new ApiError(404, "ไม่พบออเดอร์นี้");
  return mapOrderRow(data as unknown as OrderRow);
}

/**
 * ลำดับสถานะที่อนุญาต
 * pending → paid → preparing → ready → completed และยกเลิกได้ก่อนเสร็จ
 */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
