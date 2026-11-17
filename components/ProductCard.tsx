"use client";

import { formatBaht } from "@/lib/format";
import type { Product } from "@/lib/types";
import { PlusIcon } from "./Icons";
import { ProductImage } from "./ProductImage";

type Props = {
  product: Product;
  inCart: number;
  onSelect: (p: Product) => void;
  priority?: boolean;
};

export function ProductCard({ product, inCart, onSelect, priority }: Props) {
  const soldOut = !product.is_available;

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => onSelect(product)}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-100 transition active:scale-[0.98] disabled:cursor-not-allowed"
    >
      <div className="relative">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(max-width: 448px) 50vw, 220px"
          priority={priority}
          className={`aspect-square w-full ${soldOut ? "grayscale" : ""}`}
        />
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
              หมดชั่วคราว
            </span>
          </div>
        )}
        {inCart > 0 && (
          <span className="absolute top-2 left-2 animate-pop-in rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
            ในตะกร้า {inCart}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-1 font-semibold">{product.name}</p>
        <p className="line-clamp-1 text-xs text-slate-500">{product.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-brand-600">{formatBaht(product.price)}</span>
          {!soldOut && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm shadow-brand-500/40 transition group-active:scale-90">
              <PlusIcon size={18} strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
      <div className="aspect-square w-full animate-pulse bg-slate-200" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
