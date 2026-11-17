import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, json, readJson } from "@/lib/http";
import { getOrderFor, mapOrderRow, NEXT_STATUSES, ORDER_SELECT } from "@/lib/orders/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

/** เปลี่ยนสถานะออเดอร์ (เฉพาะแอดมิน และต้องเป็นลำดับที่อนุญาตเท่านั้น) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body = (await readJson(req)) as { status?: unknown };
    const next = body?.status as OrderStatus;
    if (!ORDER_STATUSES.includes(next)) throw new ApiError(400, "สถานะไม่ถูกต้อง");

    const order = await getOrderFor(id, { userId: admin.userId, admin: true });
    if (!NEXT_STATUSES[order.status].includes(next)) {
      throw new ApiError(409, "เปลี่ยนเป็นสถานะนี้ไม่ได้ กรุณารีเฟรชหน้า");
    }

    const update: Record<string, string> = { status: next };
    if (next === "paid") update.payment_status = "paid";

    const { data, error } = await getServiceSupabase()
      .from("orders")
      .update(update)
      .eq("id", order.id)
      .eq("status", order.status) // optimistic lock กันแอดมินสองคนกดพร้อมกัน
      .select(ORDER_SELECT)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(409, "ออเดอร์ถูกอัปเดตไปแล้ว กรุณารีเฟรชหน้า");

    return json({ order: mapOrderRow(data as never) });
  });
}
