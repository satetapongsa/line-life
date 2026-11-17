import type { Metadata } from "next";
import { OrdersScreen } from "@/components/orders/OrdersScreen";

export const metadata: Metadata = { title: "ออเดอร์ของฉัน | Wave Shop" };

export default function OrdersPage() {
  return <OrdersScreen />;
}
