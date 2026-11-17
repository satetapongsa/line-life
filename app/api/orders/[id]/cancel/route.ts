import { requireUser } from "@/lib/auth";
import { ApiError, handle, json } from "@/lib/http";
import { getOrderFor, mapOrderRow, ORDER_SELECT } from "@/lib/orders/server";
import { getServiceSupabase } from "@/lib/supabase/server";

/** ลูกค้ายกเลิกออเดอร์ได้เฉพาะตอนที่ยังไม่ได้ชำระ/แจ้งชำระ */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const order = await getOrderFor(id, { userId: user.userId });

    if (order.status !== "pending" || order.payment_status !== "unpaid") {
      throw new ApiError(409, "ยกเลิกไม่ได้ เพราะแจ้งชำระเงินแล้ว กรุณาติดต่อร้าน");
    }

    const { data, error } = await getServiceSupabase()
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id)
      .eq("line_user_id", user.userId)
      .eq("status", "pending")
      .eq("payment_status", "unpaid")
      .select(ORDER_SELECT)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(409, "สถานะออเดอร์เปลี่ยนไปแล้ว กรุณารีเฟรช");

    return json({ order: mapOrderRow(data as never) });
  });
}
