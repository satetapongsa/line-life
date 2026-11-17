"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CartIcon, ClockIcon, NoteIcon, QrIcon } from "@/components/Icons";
import { PageShell } from "@/components/PageShell";
import { ProductImage } from "@/components/ProductImage";
import { EmptyState } from "@/components/StateViews";
import { ClientApiError, useApi } from "@/hooks/useApi";
import { useCart } from "@/hooks/useCart";
import { useLiff } from "@/hooks/useLiff";
import { buildOrderFlex } from "@/lib/flex";
import { cartUnitPrice, formatBaht, optionSummary, SHOP_TIMEZONE } from "@/lib/format";
import { ORDER_NOTE_MAX, pickupSlots } from "@/lib/shop";
import type { Order } from "@/lib/types";

function slotLabel(d: Date, now: Date) {
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: SHOP_TIMEZONE });
  const day = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: SHOP_TIMEZONE });
  return day(d) === day(now) ? `วันนี้ ${time}` : `พรุ่งนี้ ${time}`;
}

export function CheckoutScreen() {
  const router = useRouter();
  const api = useApi();
  const { sendMessages } = useLiff();
  const cart = useCart();

  const [slots, setSlots] = useState<Date[]>([]);
  const [pickup, setPickup] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  // คำนวณช่วงเวลารับสินค้าฝั่ง browser และอัปเดตทุกนาที
  useEffect(() => {
    const update = () => {
      const next = pickupSlots();
      setSlots(next);
      setPickup((cur) => (next.some((s) => s.toISOString() === cur) ? cur : (next[0]?.toISOString() ?? "")));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  async function placeOrder() {
    if (!pickup) return;
    setSubmitting(true);
    setError(null);
    try {
      // ส่งแค่ id สินค้า/ตัวเลือก/จำนวน — ราคาและ userId server จะหาเองจากฐานข้อมูลและ ID token
      const { order } = await api<{ order: Order }>("/api/orders", {
        body: {
          items: cart.items.map((i) => ({
            productId: i.productId,
            optionIds: i.options.map((o) => o.id),
            quantity: i.quantity,
            note: i.note || undefined,
          })),
          pickupTime: pickup,
          note: note.trim() || undefined,
        },
      });

      setPlaced(true);
      // ส่ง Flex Message เข้าแชท (ได้เฉพาะในแอป LINE) ถ้าไม่สำเร็จก็ไปต่อได้
      await sendMessages(buildOrderFlex(order));
      cart.clear();
      router.replace(`/orders/${order.id}`);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่");
      setSubmitting(false);
    }
  }

  if (cart.items.length === 0 && !placed) {
    return (
      <PageShell title="ยืนยันคำสั่งซื้อ">
        <EmptyState
          icon={<CartIcon size={36} />}
          title="ตะกร้าว่างอยู่"
          description="เลือกเมนูก่อนแล้วค่อยกลับมาที่หน้านี้นะ"
          action={{ label: "ไปเลือกเมนู", onClick: () => router.push("/") }}
        />
      </PageShell>
    );
  }

  const now = new Date();

  return (
    <PageShell title="ยืนยันคำสั่งซื้อ">
      <div className="space-y-3 p-4 pb-40">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">รายการที่สั่ง</h2>
            <button type="button" onClick={() => router.push("/")} className="text-sm font-medium text-brand-600">
              แก้ไข
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {cart.items.map((i) => (
              <li key={i.key} className="flex gap-3 py-2.5">
                <ProductImage src={i.imageUrl} alt={i.name} sizes="48px" className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {i.name} <span className="text-slate-400">x{i.quantity}</span>
                  </p>
                  {i.options.length > 0 && <p className="truncate text-xs text-slate-500">{optionSummary(i.options)}</p>}
                  {i.note && <p className="truncate text-xs text-amber-600">หมายเหตุ: {i.note}</p>}
                </div>
                <p className="text-sm font-semibold">{formatBaht(cartUnitPrice(i) * i.quantity)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <ClockIcon size={18} className="text-brand-500" /> เวลามารับสินค้าที่ร้าน
          </h2>
          {slots.length === 0 ? (
            <p className="text-sm text-slate-500">กำลังโหลดเวลาที่ว่าง...</p>
          ) : (
            <>
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {slots.slice(0, 6).map((s, idx) => {
                  const iso = s.toISOString();
                  const active = iso === pickup;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setPickup(iso)}
                      className={`shrink-0 rounded-xl px-3 py-2 text-sm transition active:scale-95 ${
                        active ? "bg-brand-50 font-semibold text-brand-700 ring-2 ring-brand-500" : "bg-white ring-1 ring-slate-200"
                      }`}
                    >
                      {idx === 0 ? "เร็วที่สุด · " : ""}
                      {slotLabel(s, now)}
                    </button>
                  );
                })}
              </div>
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                aria-label="เลือกเวลาอื่น"
                className="mt-3 w-full rounded-xl bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
              >
                {slots.map((s) => (
                  <option key={s.toISOString()} value={s.toISOString()}>
                    {slotLabel(s, now)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-400">ร้านเปิด 08:00–20:00 น. ใช้เวลาเตรียมประมาณ 15 นาที</p>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <label htmlFor="order-note" className="mb-2 flex items-center gap-2 font-semibold">
            <NoteIcon size={18} className="text-brand-500" /> หมายเหตุถึงร้าน
          </label>
          <textarea
            id="order-note"
            value={note}
            maxLength={ORDER_NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="เช่น ขอถุงแยก, จะมารับช้ากว่านี้ 5 นาที"
            className="w-full resize-none rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
          />
        </section>

        <section className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <QrIcon size={20} />
          </div>
          <div className="text-sm">
            <p className="font-semibold">ชำระด้วยพร้อมเพย์</p>
            <p className="text-slate-500">แสดง QR ให้สแกนหลังยืนยันคำสั่งซื้อ</p>
          </div>
        </section>
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-slate-100 bg-white px-4 pt-3">
        {error && (
          <p role="alert" className="mb-2 animate-fade-in rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm text-slate-500">ยอดชำระ ({cart.count} ชิ้น)</span>
          <span className="text-xl font-bold">{formatBaht(cart.total)}</span>
        </div>
        <button
          type="button"
          onClick={placeOrder}
          disabled={submitting || !pickup}
          className="w-full rounded-full bg-brand-500 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/30 transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "กำลังสั่งซื้อ..." : "ยืนยันสั่งซื้อ"}
        </button>
      </div>
    </PageShell>
  );
}
