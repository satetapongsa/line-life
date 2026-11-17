import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { getOrderFor } from "@/lib/orders/server";
import { createPromptPayQr } from "@/lib/promptpay";

/** รายละเอียดออเดอร์ + QR พร้อมเพย์ (ถ้ายังไม่ได้ชำระ) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const order = await getOrderFor(id, { userId: user.userId });

    const payment =
      order.status === "pending" && order.payment_status !== "paid"
        ? await createPromptPayQr(order.total)
        : null;

    return json({ order, payment });
  });
}
