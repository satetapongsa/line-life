"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, ClockIcon, QrIcon, RefreshIcon } from "@/components/Icons";
import { PageShell } from "@/components/PageShell";
import { ErrorState } from "@/components/StateViews";
import { ClientApiError, useApi } from "@/hooks/useApi";
import { useLiff } from "@/hooks/useLiff";
import { formatBaht, formatDateTime, formatOrderNo, optionSummary } from "@/lib/format";
import type { Order } from "@/lib/types";
import { OrderTimeline, StatusBadge } from "./OrderParts";

type Payment = { dataUrl: string; maskedId: string; amount: number } | null;
type Detail = { order: Order; payment: Payment };

const POLL_MS = 5000;
const FINAL = new Set(["completed", "cancelled"]);

export function OrderDetailScreen({ id }: { id: string }) {
  const api = useApi();
  const router = useRouter();
  const { isInClient, closeWindow } = useLiff();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"pay" | "cancel" | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [updatedFlash, setUpdatedFlash] = useState(false);
  const lastStatus = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<Detail>(`/api/orders/${id}`);
      const key = `${data.order.status}|${data.order.payment_status}`;
      if (lastStatus.current && lastStatus.current !== key) {
        setUpdatedFlash(true);
        setTimeout(() => setUpdatedFlash(false), 2500);
      }
      lastStatus.current = key;
      setDetail(data);
      setError(null);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "โหลดออเดอร์ไม่สำเร็จ");
    }
  }, [api, id]);

  // โหลดครั้งแรก + polling ทุก 5 วินาที จนกว่าออเดอร์จะจบ (หยุดเมื่อแท็บถูกซ่อน)
  const status = detail?.order.status;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดข้อมูลจาก API
    if (!status) load();
    if (status && FINAL.has(status)) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, status]);

  async function act(kind: "pay" | "cancel") {
    setBusy(kind);
    setActionError(null);
    try {
      const { order } = await api<{ order: Order }>(`/api/orders/${id}/${kind === "pay" ? "payment" : "cancel"}`, {
        method: "POST",
      });
      setDetail((d) => (d ? { ...d, order, payment: kind === "cancel" ? null : d.payment } : d));
      lastStatus.current = `${order.status}|${order.payment_status}`;
    } catch (e) {
      setActionError(e instanceof ClientApiError ? e.message : "ทำรายการไม่สำเร็จ");
    } finally {
      setBusy(null);
      setConfirmCancel(false);
    }
  }

  if (error && !detail) {
    return (
      <PageShell title="สถานะออเดอร์" backHref="/orders">
        <ErrorState title="ไม่พบออเดอร์" message={error} onRetry={load} />
      </PageShell>
    );
  }

  if (!detail) {
    return (
      <PageShell title="สถานะออเดอร์" backHref="/orders">
        <div className="space-y-3 p-4">
          <div className="h-24 animate-pulse rounded-2xl bg-white" />
          <div className="h-72 animate-pulse rounded-2xl bg-white" />
          <div className="h-40 animate-pulse rounded-2xl bg-white" />
        </div>
      </PageShell>
    );
  }

  const { order, payment } = detail;
  const awaitingPayment = order.status === "pending";

  return (
    <PageShell
      title={`ออเดอร์ ${formatOrderNo(order.order_no)}`}
      backHref="/orders"
      right={
        <button type="button" onClick={load} aria-label="รีเฟรช" className="rounded-full p-2 text-slate-500 active:scale-95">
          <RefreshIcon size={18} />
        </button>
      }
    >
      <div className="space-y-3 p-4">
        {updatedFlash && (
          <p className="animate-fade-in rounded-xl bg-brand-50 px-3 py-2 text-center text-sm font-medium text-brand-700">
            สถานะออเดอร์อัปเดตแล้ว
          </p>
        )}

        <section className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div>
            <p className="text-xs text-slate-500">สั่งเมื่อ {formatDateTime(order.created_at)}</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
              <ClockIcon size={16} className="text-brand-500" /> มารับ {formatDateTime(order.pickup_time)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </section>

        {awaitingPayment && (
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <QrIcon size={18} className="text-sky-600" /> ชำระเงินด้วยพร้อมเพย์
            </h2>

            {order.payment_status === "reported" ? (
              <div className="flex animate-fade-in flex-col items-center py-4 text-center">
                <span className="mb-3 flex h-14 w-14 animate-pop-in items-center justify-center rounded-full bg-brand-500 text-white">
                  <CheckIcon size={28} strokeWidth={3} />
                </span>
                <p className="font-semibold">แจ้งชำระเงินแล้ว</p>
                <p className="text-sm text-slate-500">รอร้านตรวจสอบยอดเงินสักครู่ หน้านี้จะอัปเดตอัตโนมัติ</p>
              </div>
            ) : payment ? (
              <div className="flex flex-col items-center">
                <div className="rounded-2xl border-2 border-[#113566] p-3">
                  <p className="mb-1 rounded bg-[#113566] py-1 text-center text-xs font-bold tracking-wider text-white">
                    PromptPay
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element -- QR เป็น data URL ที่ server สร้าง */}
                  <img src={payment.dataUrl} alt="QR พร้อมเพย์" className="h-56 w-56" />
                </div>
                <p className="mt-3 text-2xl font-bold">{formatBaht(payment.amount)}</p>
                <p className="text-xs text-slate-500">พร้อมเพย์ {payment.maskedId} · Wave Shop</p>
                <p className="mt-2 text-center text-xs text-slate-400">
                  แคปหน้าจอแล้วสแกนจ่ายในแอปธนาคาร จากนั้นกดปุ่มด้านล่าง
                </p>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => act("pay")}
                  className="mt-4 w-full rounded-full bg-brand-500 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/30 transition active:scale-[0.98] disabled:opacity-60"
                >
                  {busy === "pay" ? "กำลังแจ้ง..." : "แจ้งชำระเงิน"}
                </button>
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                ร้านยังไม่ได้ตั้งค่าบัญชีพร้อมเพย์ กรุณาชำระเงินที่หน้าร้าน
              </p>
            )}

            {order.payment_status === "unpaid" && (
              <div className="mt-3 text-center">
                {confirmCancel ? (
                  <div className="flex animate-fade-in gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(false)}
                      className="flex-1 rounded-full bg-slate-100 py-2.5 text-sm font-medium"
                    >
                      ไม่ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => act("cancel")}
                      className="flex-1 rounded-full bg-rose-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busy === "cancel" ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmCancel(true)} className="text-sm text-rose-500">
                    ยกเลิกออเดอร์
                  </button>
                )}
              </div>
            )}

            {actionError && (
              <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {actionError}
              </p>
            )}
          </section>
        )}

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 font-semibold">สถานะ</h2>
          <OrderTimeline status={order.status} />
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-2 font-semibold">รายการ</h2>
          <ul className="divide-y divide-slate-100">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    {i.product_name} <span className="text-slate-400">x{i.quantity}</span>
                  </p>
                  {i.options.length > 0 && <p className="text-xs text-slate-500">{optionSummary(i.options)}</p>}
                  {i.note && <p className="text-xs text-amber-600">หมายเหตุ: {i.note}</p>}
                </div>
                <p className="shrink-0 font-semibold">{formatBaht(i.line_total)}</p>
              </li>
            ))}
          </ul>
          {order.note && (
            <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-700">หมายเหตุถึงร้าน: {order.note}</p>
          )}
          <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-slate-200 pt-3">
            <span className="text-sm text-slate-500">ยอดรวม</span>
            <span className="text-xl font-bold text-brand-600">{formatBaht(order.total)}</span>
          </div>
        </section>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex-1 rounded-full bg-white py-3 text-sm font-semibold ring-1 ring-slate-200 active:scale-[0.98]"
          >
            สั่งเพิ่ม
          </button>
          {isInClient && (
            <button
              type="button"
              onClick={closeWindow}
              className="flex-1 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white active:scale-[0.98]"
            >
              กลับไปที่แชท
            </button>
          )}
        </div>
      </div>
    </PageShell>
  );
}
