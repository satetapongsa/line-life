"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronRightIcon, ClockIcon, ReceiptIcon } from "@/components/Icons";
import { PageShell } from "@/components/PageShell";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { ClientApiError, useApi } from "@/hooks/useApi";
import { formatBaht, formatDateTime, formatOrderNo, formatTime } from "@/lib/format";
import type { Order } from "@/lib/types";
import { StatusBadge } from "./OrderParts";

export function OrdersScreen() {
  const api = useApi();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{ orders: Order[] }>("/api/orders");
      setOrders(data.orders);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "โหลดประวัติไม่สำเร็จ");
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดข้อมูลครั้งแรกจาก API
    load();
  }, [load]);

  return (
    <PageShell title="ออเดอร์ของฉัน">
      <div className="space-y-3 p-4">
        {error ? (
          <ErrorState title="โหลดประวัติการสั่งซื้อไม่สำเร็จ" message={error} onRetry={load} />
        ) : orders === null ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
          ))
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ReceiptIcon size={36} />}
            title="ยังไม่มีประวัติการสั่งซื้อ"
            description="สั่งเมนูแรกของคุณเลย แล้วติดตามสถานะได้ที่หน้านี้"
            action={{ label: "ไปเลือกเมนู", onClick: () => router.push("/") }}
          />
        ) : (
          orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="block animate-fade-in rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">ออเดอร์ {formatOrderNo(o.order_no)}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(o.created_at)}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-2 line-clamp-1 text-sm text-slate-600">
                {o.items.map((i) => `${i.product_name} x${i.quantity}`).join(", ")}
              </p>
              <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-200 pt-2">
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <ClockIcon size={14} /> รับ {formatTime(o.pickup_time)} น.
                </span>
                <span className="flex items-center gap-1 font-bold text-brand-600">
                  {formatBaht(o.total)} <ChevronRightIcon size={16} className="text-slate-400" />
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </PageShell>
  );
}
