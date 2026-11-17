"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { cartUnitPrice, formatBaht, OPTION_GROUP_LABEL } from "@/lib/format";
import { BottomSheet } from "./BottomSheet";
import { CartIcon, ChevronRightIcon, ClockIcon, NoteIcon, QrIcon, TrashIcon } from "./Icons";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";
import { EmptyState } from "./StateViews";

type Props = {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  checkoutLabel?: string;
  busy?: boolean;
};

export function CartSheet({ open, onClose, onCheckout, checkoutLabel = "ไปหน้าชำระเงิน", busy }: Props) {
  const { items, count, total, setQuantity, removeItem, clear } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setConfirmClear(false);
        onClose();
      }}
      title="ตะกร้าของฉัน"
      footer={
        items.length > 0 && (
          <>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-slate-500">ยอดรวม {count} ชิ้น</p>
                <p className="text-2xl leading-tight font-bold text-slate-900">{formatBaht(total)}</p>
              </div>
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <QrIcon size={14} /> จ่ายด้วยพร้อมเพย์
              </p>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              disabled={busy}
              className="flex w-full items-center justify-center gap-1 rounded-full bg-brand-500 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/30 transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? "กำลังดำเนินการ..." : checkoutLabel}
              {!busy && <ChevronRightIcon size={18} strokeWidth={2.5} />}
            </button>
          </>
        )
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<CartIcon size={36} />}
          title="ตะกร้ายังว่างอยู่"
          description="เลือกเมนูที่ชอบแล้วกดใส่ตะกร้าได้เลย"
          action={{ label: "เลือกเมนู", onClick: onClose }}
        />
      ) : (
        <div className="space-y-3 px-5 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{items.length} รายการ</p>
            {confirmClear ? (
              <span className="flex animate-fade-in items-center gap-3 text-sm">
                <button type="button" onClick={() => setConfirmClear(false)} className="text-slate-500">
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setConfirmClear(false);
                  }}
                  className="font-semibold text-rose-500"
                >
                  ยืนยันล้างทั้งหมด
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1 text-sm text-slate-500 active:scale-95"
              >
                <TrashIcon size={14} /> ล้างตะกร้า
              </button>
            )}
          </div>

          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.key}
                className="animate-fade-in rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"
              >
                <div className="flex gap-3">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    sizes="72px"
                    className="h-[72px] w-[72px] shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 leading-snug font-semibold">{item.name}</p>
                      <button
                        type="button"
                        aria-label={`ลบ ${item.name}`}
                        onClick={() => removeItem(item.key)}
                        className="-mt-1 -mr-1 shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 active:scale-90"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                    {(item.options.length > 0 || item.note) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.options.map((o) => (
                          <span
                            key={o.id}
                            className="rounded-md bg-white px-1.5 py-0.5 text-[11px] text-slate-600 ring-1 ring-slate-200"
                          >
                            {OPTION_GROUP_LABEL[o.group] === "ขนาด" ? "ไซซ์ " : "หวาน "}
                            {o.label}
                            {o.priceDelta > 0 && ` +${o.priceDelta}`}
                          </span>
                        ))}
                        {item.note && (
                          <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700 ring-1 ring-amber-200">
                            <NoteIcon size={11} className="shrink-0" />
                            <span className="truncate">{item.note}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-slate-200 pt-2.5">
                  <div>
                    <p className="text-[11px] text-slate-400">
                      {formatBaht(cartUnitPrice(item))} × {item.quantity}
                    </p>
                    <p className="font-bold text-brand-600">{formatBaht(cartUnitPrice(item) * item.quantity)}</p>
                  </div>
                  <QuantityStepper
                    size="sm"
                    removable
                    value={item.quantity}
                    onChange={(q) => setQuantity(item.key, q)}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs text-brand-700">
            <ClockIcon size={16} className="shrink-0" />
            เลือกเวลามารับสินค้าได้ในขั้นตอนถัดไป
          </p>
        </div>
      )}
    </BottomSheet>
  );
}
