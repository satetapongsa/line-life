"use client";

import { useMemo, useState } from "react";
import { MAX_QTY, useCart } from "@/hooks/useCart";
import { formatBaht, OPTION_GROUP_LABEL } from "@/lib/format";
import type { OptionGroup, Product, ProductOption } from "@/lib/types";
import { BottomSheet } from "./BottomSheet";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";

const NOTE_MAX = 100;

function groupOptions(options: ProductOption[]) {
  const groups = new Map<OptionGroup, ProductOption[]>();
  for (const o of [...options].sort((a, b) => a.sort_order - b.sort_order)) {
    groups.set(o.group_name, [...(groups.get(o.group_name) ?? []), o]);
  }
  return groups;
}

function defaultSelection(groups: Map<OptionGroup, ProductOption[]>) {
  const sel: Partial<Record<OptionGroup, string>> = {};
  for (const [group, opts] of groups) {
    sel[group] = (opts.find((o) => o.is_default) ?? opts[0]).id;
  }
  return sel;
}

type Props = {
  product: Product | null;
  onClose: () => void;
  onAdded: (name: string) => void;
};

export function ProductSheet({ product, onClose, onAdded }: Props) {
  return (
    <BottomSheet open={!!product} onClose={onClose} title={product?.name}>
      {product && <ProductForm key={product.id} product={product} onDone={onClose} onAdded={onAdded} />}
    </BottomSheet>
  );
}

function ProductForm({
  product,
  onDone,
  onAdded,
}: {
  product: Product;
  onDone: () => void;
  onAdded: (name: string) => void;
}) {
  const { addItem } = useCart();
  const groups = useMemo(() => groupOptions(product.options), [product.options]);
  const [selected, setSelected] = useState(() => defaultSelection(groups));
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  const chosen = product.options.filter((o) => Object.values(selected).includes(o.id));
  const unitPrice = product.price + chosen.reduce((s, o) => s + o.price_delta, 0);

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      imageUrl: product.image_url,
      basePrice: product.price,
      options: chosen.map((o) => ({
        id: o.id,
        group: o.group_name,
        label: o.label,
        priceDelta: o.price_delta,
      })),
      note: note.trim(),
      quantity: qty,
    });
    onAdded(product.name);
    onDone();
  }

  return (
    <>
      <div className="px-5">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="448px"
          className="aspect-[16/10] w-full rounded-2xl"
        />
        <div className="mt-3 flex items-start justify-between gap-3">
          <p className="text-sm text-slate-500">{product.description}</p>
          <p className="shrink-0 text-lg font-bold text-brand-600">{formatBaht(product.price)}</p>
        </div>
      </div>

      {[...groups].map(([group, opts]) => (
        <fieldset key={group} className="mt-5 px-5">
          <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">
            {OPTION_GROUP_LABEL[group]}
            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
              เลือก 1
            </span>
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {opts.map((o) => {
              const active = selected[group] === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected((s) => ({ ...s, [group]: o.id }))}
                  className={`rounded-xl px-2 py-2.5 text-center text-sm transition active:scale-95 ${
                    active
                      ? "bg-brand-50 font-semibold text-brand-700 ring-2 ring-brand-500"
                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  <span className="block">{o.label}</span>
                  {o.price_delta > 0 && (
                    <span className="block text-[11px] text-slate-500">+{o.price_delta}</span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="mt-5 px-5">
        <label htmlFor="item-note" className="mb-2 block text-sm font-semibold">
          หมายเหตุถึงร้าน <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
        </label>
        <textarea
          id="item-note"
          value={note}
          maxLength={NOTE_MAX}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="เช่น น้ำแข็งน้อย, ไม่ใส่หลอด"
          className="w-full resize-none rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-right text-[11px] text-slate-400">
          {note.length}/{NOTE_MAX}
        </p>
      </div>

      <div className="pb-safe sticky bottom-0 mt-2 flex items-center gap-3 border-t border-slate-100 bg-white px-5 pt-3">
        <QuantityStepper value={qty} onChange={setQty} max={MAX_QTY} />
        <button
          type="button"
          onClick={handleAdd}
          className="flex flex-1 items-center justify-between rounded-full bg-brand-500 px-5 py-3 font-semibold text-white shadow-lg shadow-brand-500/30 transition active:scale-[0.98]"
        >
          <span>ใส่ตะกร้า</span>
          <span>{formatBaht(unitPrice * qty)}</span>
        </button>
      </div>
    </>
  );
}
