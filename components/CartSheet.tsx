"use client";

import { useCart } from "@/hooks/useCart";
import { cartUnitPrice, formatBaht, optionSummary } from "@/lib/format";
import { BottomSheet } from "./BottomSheet";
import { CartIcon, NoteIcon } from "./Icons";
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
  const { items, count, total, setQuantity, clear } = useCart();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`ตะกร้าของฉัน${count ? ` (${count})` : ""}`}
      footer={
        items.length > 0 && (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-slate-500">ยอดรวม</span>
              <span className="text-xl font-bold">{formatBaht(total)}</span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              disabled={busy}
              className="w-full rounded-full bg-brand-500 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/30 transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? "กำลังดำเนินการ..." : checkoutLabel}
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
        <div className="px-5 pb-4">
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3 py-3">
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  sizes="64px"
                  className="h-16 w-16 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.name}</p>
                  {item.options.length > 0 && (
                    <p className="truncate text-xs text-slate-500">{optionSummary(item.options)}</p>
                  )}
                  {item.note && (
                    <p className="flex items-center gap-1 truncate text-xs text-amber-600">
                      <NoteIcon size={12} /> {item.note}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-semibold text-brand-600">
                      {formatBaht(cartUnitPrice(item) * item.quantity)}
                    </span>
                    <QuantityStepper
                      size="sm"
                      removable
                      value={item.quantity}
                      onChange={(q) => setQuantity(item.key, q)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={clear}
            className="mt-1 text-xs font-medium text-rose-500 underline-offset-2 hover:underline"
          >
            ล้างตะกร้าทั้งหมด
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
