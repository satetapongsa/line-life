import { requireUser } from "@/lib/auth";
import { ApiError, handle, json, readJson } from "@/lib/http";
import { parseOrderRequest, priceOrder, validatePickupTime } from "@/lib/orders/pricing";
import { mapOrderRow, ORDER_SELECT } from "@/lib/orders/server";
import { getServiceSupabase } from "@/lib/supabase/server";

const MAX_OPEN_ORDERS = 5;

/** ประวัติออเดอร์ของผู้ใช้ที่ login อยู่ (userId มาจาก ID token ที่ verify แล้วเท่านั้น) */
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const { data, error } = await getServiceSupabase()
      .from("orders")
      .select(ORDER_SELECT)
      .eq("line_user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return json({ orders: data.map((row) => mapOrderRow(row as never)) });
  });
}

/** สร้างออเดอร์ใหม่ */
export async function POST(req: Request) {
  return handle(async () => {
    // 1) ยืนยันตัวตนกับ LINE ก่อนทำอะไรทั้งนั้น
    const user = await requireUser(req);
    const supabase = getServiceSupabase();

    // 2) ตรวจรูปแบบข้อมูลและเวลารับสินค้า
    const body = parseOrderRequest(await readJson(req));
    const pickupTime = validatePickupTime(body.pickupTime);

    // 3) กันสแปม: ออเดอร์ค้างชำระต่อคนต้องไม่เกินกำหนด
    const { count, error: countError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("line_user_id", user.userId)
      .eq("status", "pending");
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_OPEN_ORDERS) {
      throw new ApiError(429, "คุณมีออเดอร์ที่ยังไม่ชำระเงินหลายรายการ กรุณาชำระหรือยกเลิกก่อน");
    }

    // 4) คำนวณราคาใหม่จากฐานข้อมูล
    const { items, total } = await priceOrder(body);

    // 5) บันทึกแบบ transaction
    const { data: orderId, error } = await supabase.rpc("create_order", {
      p_line_user_id: user.userId,
      p_display_name: user.displayName,
      p_total: total,
      p_pickup_time: pickupTime.toISOString(),
      p_note: body.note ?? null,
      p_items: items,
    });
    if (error) throw error;

    const { data: order, error: readError } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", orderId)
      .single();
    if (readError) throw readError;

    return json({ order: mapOrderRow(order as never) }, { status: 201 });
  });
}
