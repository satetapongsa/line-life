import { requireUser } from "@/lib/auth";
import { ApiError, handle, json } from "@/lib/http";
import { getOrderFor, mapOrderRow, ORDER_SELECT } from "@/lib/orders/server";
import { getServiceSupabase } from "@/lib/supabase/server";

/**
 * ลูกค้ากด "แจ้งชำระเงิน" (เดโม ไม่ได้ตรวจสลิปจริง)
 * เปลี่ยน payment_status เป็น reported เท่านั้น ลูกค้าเปลี่ยนเป็น paid เองไม่ได้
 * ร้านค้าจะเป็นคนกดยืนยันในหน้าแอดมิน
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const order = await getOrderFor(id, { userId: user.userId });

    if (order.status !== "pending" || order.payment_status !== "unpaid") {
      throw new ApiError(409, "ออเดอร์นี้แจ้งชำระเงินไปแล้ว หรือไม่อยู่ในสถานะรอชำระ");
    }

    const { data, error } = await getServiceSupabase()
      .from("orders")
      .update({ payment_status: "reported" })
      .eq("id", order.id)
      .eq("line_user_id", user.userId)
      .eq("payment_status", "unpaid") // กันการกดซ้ำพร้อมกัน
      .select(ORDER_SELECT)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(409, "สถานะออเดอร์เปลี่ยนไปแล้ว กรุณารีเฟรช");

    return json({ order: mapOrderRow(data as never) });
  });
}
