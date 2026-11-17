"use client";

import { useCart } from "@/hooks/useCart";
import { formatBaht } from "@/lib/format";
import { CartIcon, ChevronRightIcon } from "./Icons";
import { ProductImage } from "./ProductImage";

export function CartBar({ onClick }: { onClick: () => void }) {
  const { items, count, total, addedTick } = useCart();
  if (count === 0) return null;

  const thumbs = items.slice(-3);

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md animate-fade-in px-4 pt-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={`ดูตะกร้า ${count} ชิ้น รวม ${formatBaht(total)}`}
        className="flex w-full items-center gap-3 rounded-full bg-brand-600 py-2 pr-4 pl-2 text-white shadow-xl shadow-brand-700/30 ring-1 ring-white/20 transition active:scale-[0.98]"
      >
        <span key={addedTick} className="flex animate-bump items-center">
          {thumbs.map((t, i) => (
            <span
              key={t.key}
              className={`relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-brand-600 ${i > 0 ? "-ml-3" : ""}`}
              style={{ zIndex: i }}
            >
              <ProductImage src={t.imageUrl} alt="" sizes="40px" className="h-full w-full" />
            </span>
          ))}
        </span>
        <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <CartIcon size={15} /> {count} ชิ้นในตะกร้า
          </span>
          <span className="text-[11px] text-white/80">แตะเพื่อตรวจสอบและสั่งซื้อ</span>
        </span>
        <span className="flex items-center gap-0.5 text-lg font-bold">
          {formatBaht(total)}
          <ChevronRightIcon size={18} strokeWidth={2.5} />
        </span>
      </button>
    </div>
  );
}
