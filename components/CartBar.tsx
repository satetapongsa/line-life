"use client";

import { useCart } from "@/hooks/useCart";
import { formatBaht } from "@/lib/format";
import { CartIcon } from "./Icons";

export function CartBar({ onClick }: { onClick: () => void }) {
  const { count, total, addedTick } = useCart();
  if (count === 0) return null;

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md animate-fade-in px-4 pt-2">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-full bg-brand-500 py-2.5 pr-5 pl-2.5 text-white shadow-xl shadow-brand-600/30 transition active:scale-[0.98]"
      >
        <span key={addedTick} className="relative flex h-10 w-10 animate-bump items-center justify-center rounded-full bg-white/20">
          <CartIcon size={20} />
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-600">
            {count}
          </span>
        </span>
        <span className="flex-1 text-left font-semibold">ดูตะกร้า</span>
        <span className="text-lg font-bold">{formatBaht(total)}</span>
      </button>
    </div>
  );
}
