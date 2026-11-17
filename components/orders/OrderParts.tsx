"use client";

import { STATUS_COLOR, STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { CheckIcon, CloseIcon } from "../Icons";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const STEPS: { status: OrderStatus; title: string; desc: string }[] = [
  { status: "pending", title: "สั่งซื้อแล้ว", desc: "รอชำระเงินผ่านพร้อมเพย์" },
  { status: "paid", title: "ชำระเงินแล้ว", desc: "ร้านได้รับยอดเงินเรียบร้อย" },
  { status: "preparing", title: "กำลังเตรียม", desc: "บาริสต้ากำลังทำเมนูของคุณ" },
  { status: "ready", title: "พร้อมรับสินค้า", desc: "มารับที่หน้าร้านได้เลย" },
  { status: "completed", title: "รับสินค้าแล้ว", desc: "ขอบคุณที่อุดหนุนค่ะ" },
];

/** timeline สถานะออเดอร์แนวตั้ง */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-rose-700">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white">
          <CloseIcon size={18} />
        </span>
        <div>
          <p className="font-semibold">ออเดอร์ถูกยกเลิก</p>
          <p className="text-sm text-rose-600/80">หากมีข้อสงสัย กรุณาติดต่อร้านทางแชท</p>
        </div>
      </div>
    );
  }

  const current = STEPS.findIndex((s) => s.status === status);

  return (
    <ol className="relative">
      {STEPS.map((step, i) => {
        const done = i < current || status === "completed";
        const active = i === current && status !== "completed";
        const last = i === STEPS.length - 1;
        return (
          <li key={step.status} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                className={`absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5 ${done ? "bg-brand-500" : "bg-slate-200"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                done
                  ? "bg-brand-500 text-white"
                  : active
                    ? "bg-white text-brand-600 ring-4 ring-brand-100 outline-2 outline-brand-500"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <CheckIcon size={16} strokeWidth={3} /> : i + 1}
              {active && <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/30" />}
            </span>
            <div className="pt-1">
              <p className={`text-sm font-semibold ${done || active ? "text-slate-900" : "text-slate-400"}`}>
                {step.title}
              </p>
              {(done || active) && <p className="text-xs text-slate-500">{step.desc}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
