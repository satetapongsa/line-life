import { requireAdmin } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabase/server";

const BKK_OFFSET_MS = 7 * 3_600_000;
const PAID_STATUSES = ["paid", "preparing", "ready", "completed"];

/** เวลาเริ่มต้นของ "วันนี้" ตามเวลาไทย (เป็น UTC ISO string) */
function startOfBangkokDay(now = new Date()) {
  const local = new Date(now.getTime() + BKK_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - BKK_OFFSET_MS);
}

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const supabase = getServiceSupabase();
    const today = startOfBangkokDay();
    const weekAgo = new Date(today.getTime() - 6 * 86_400_000);

    const [todayRes, weekRes] = await Promise.all([
      supabase.from("orders").select("status, payment_status, total").gte("created_at", today.toISOString()),
      supabase
        .from("orders")
        .select("order_items(product_name, quantity, line_total)")
        .in("status", PAID_STATUSES)
        .gte("created_at", weekAgo.toISOString())
        .limit(2000),
    ]);
    if (todayRes.error) throw todayRes.error;
    if (weekRes.error) throw weekRes.error;

    const todays = todayRes.data;
    const paidToday = todays.filter((o) => PAID_STATUSES.includes(o.status));

    const top = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of weekRes.data) {
      for (const item of order.order_items ?? []) {
        const row = top.get(item.product_name) ?? { name: item.product_name, quantity: 0, revenue: 0 };
        row.quantity += item.quantity;
        row.revenue += Number(item.line_total);
        top.set(item.product_name, row);
      }
    }

    return json({
      salesToday: paidToday.reduce((s, o) => s + Number(o.total), 0),
      ordersToday: todays.filter((o) => o.status !== "cancelled").length,
      paidOrdersToday: paidToday.length,
      awaitingConfirmation: todays.filter((o) => o.status === "pending" && o.payment_status === "reported").length,
      inProgress: todays.filter((o) => o.status === "paid" || o.status === "preparing").length,
      topProducts: [...top.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    });
  });
}
