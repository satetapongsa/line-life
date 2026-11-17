import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, json } from "@/lib/http";
import { mapOrderRow, ORDER_SELECT } from "@/lib/orders/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

/** รายการออเดอร์ทั้งหมด กรองตามสถานะได้ (?status=pending) */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const status = new URL(req.url).searchParams.get("status");
    if (status && !ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new ApiError(400, "สถานะไม่ถูกต้อง");
    }

    let query = getServiceSupabase()
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false })
      .limit(100);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return json({ orders: data.map((row) => mapOrderRow(row as never)) });
  });
}
