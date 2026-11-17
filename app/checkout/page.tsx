import type { Metadata } from "next";
import { CheckoutScreen } from "@/components/checkout/CheckoutScreen";

export const metadata: Metadata = { title: "ยืนยันคำสั่งซื้อ | Wave Shop" };

export default function CheckoutPage() {
  return <CheckoutScreen />;
}
