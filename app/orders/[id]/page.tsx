import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetailScreen } from "@/components/orders/OrderDetailScreen";
import { FullScreenLoader } from "@/components/StateViews";

export const metadata: Metadata = { title: "สถานะออเดอร์ | Wave Shop" };

// params ไม่รู้ตอน build (ไม่มี generateStaticParams) จึงต้องอ่านภายใน <Suspense>
export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailScreen id={id} />;
}
