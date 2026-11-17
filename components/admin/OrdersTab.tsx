"use client";

import { useCallback, useEffect, useState } from "react";
import { ReceiptIcon } from "@/components/Icons";
import { StatusBadge } from "@/components/orders/OrderParts";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { ClientApiError, useApi } from "@/hooks/useApi";
import {
  formatBaht,
  formatDateTime,
  formatOrderNo,
  optionSummary,
  PAYMENT_LABEL,
  STATUS_LABEL,
} from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const FILTERS: (OrderStatus | "all")[] = ["all", "pending", "paid", "preparing", "ready", "completed", "cancelled"];

/** ปุ่ม action ถัดไปของแต่ละสถานะ (ต้องตรงกับ NEXT_STATUSES ฝั่ง server) */
const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: "paid", label: "ยืนยันได้รับเงินแล้ว" },
  paid: { to: "preparing", label: "เริ่มเตรียม" },
  preparing: { to: "ready", label: "พร้อมให้รับ" },
  ready: { to: "completed", label: "ลูกค้ารับแล้ว" },
};

export function OrdersTab() {
  const api = useApi();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const q = filter === "all" ? "" : `?status=${filter}`;
      const data = await api<{ orders: Order[] }>(`/api/admin/orders${q}`);
      setOrders(data.orders);
      setError(null);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "โหลดออเดอร์ไม่สำเร็จ");
    }
  }, [api, filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดออเดอร์ใหม่เมื่อเปลี่ยนตัวกรอง
    setOrders(null);
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), 10_000);
    return () => clearInterval(id);
  }, [load]);

  async function changeStatus(order: Order, to: OrderStatus) {
    if (to === "cancelled" && !window.confirm(`ยกเลิกออเดอร์ ${formatOrderNo(order.order_no)} ?`)) return;
    setBusyId(order.id);
    setActionError(null);
    try {
      const { order: updated } = await api<{ order: Order }>(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        body: { status: to },
      });
      setOrders((list) =>
        (list ?? [])
          .map((o) => (o.id === updated.id ? updated : o))
          .filter((o) => filter === "all" || o.status === filter)
      );
    } catch (e) {
      setActionError(e instanceof ClientApiError ? e.message : "เปลี่ยนสถานะไม่สำเร็จ");
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {f === "all" ? "ทั้งหมด" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {actionError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{actionError}</p>}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : orders === null ? (
        Array.from({ length: 3 }, (_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white" />)
      ) : orders.length === 0 ? (
        <EmptyState icon={<ReceiptIcon size={36} />} title="ไม่มีออเดอร์ในสถานะนี้" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {orders.map((o) => {
            const next = NEXT_ACTION[o.status];
            const reported = o.status === "pending" && o.payment_status === "reported";
            const canCancel = o.status !== "completed" && o.status !== "cancelled";
            return (
              <article
                key={o.id}
                className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ${reported ? "ring-2 ring-amber-400" : "ring-slate-100"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {formatOrderNo(o.order_no)} · {o.display_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      สั่ง {formatDateTime(o.created_at)} · รับ <b>{formatDateTime(o.pickup_time)}</b>
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <ul className="mt-2 space-y-1 text-sm">
                  {o.items.map((i) => (
                    <li key={i.id}>
                      <span className="font-medium">
                        {i.quantity}× {i.product_name}
                      </span>
                      {i.options.length > 0 && <span className="text-slate-500"> ({optionSummary(i.options)})</span>}
                      {i.note && <span className="block text-xs text-amber-600">→ {i.note}</span>}
                    </li>
                  ))}
                </ul>
                {o.note && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">หมายเหตุ: {o.note}</p>}

                <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-sm">
                  <span className={reported ? "font-semibold text-amber-600" : "text-slate-500"}>
                    {PAYMENT_LABEL[o.payment_status]}
                  </span>
                  <span className="font-bold">{formatBaht(o.total)}</span>
                </div>

                {(next || canCancel) && (
                  <div className="mt-3 flex gap-2">
                    {canCancel && (
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => changeStatus(o, "cancelled")}
                        className="rounded-full px-3 py-2 text-sm font-medium text-rose-500 ring-1 ring-rose-200 disabled:opacity-50"
                      >
                        ยกเลิก
                      </button>
                    )}
                    {next && (
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => changeStatus(o, next.to)}
                        className="flex-1 rounded-full bg-brand-500 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
                      >
                        {busyId === o.id ? "กำลังบันทึก..." : next.label}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
