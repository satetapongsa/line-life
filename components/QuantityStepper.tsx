"use client";

import { MinusIcon, PlusIcon, TrashIcon } from "./Icons";

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  /** แสดงไอคอนถังขยะเมื่อจำนวนเหลือ 1 (กดแล้วลบ) */
  removable?: boolean;
};

export function QuantityStepper({ value, onChange, min = 1, max = 20, size = "md", removable }: Props) {
  const btn = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const icon = size === "sm" ? 14 : 18;
  const showTrash = removable && value <= 1;

  return (
    <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
      <button
        type="button"
        aria-label={showTrash ? "ลบ" : "ลดจำนวน"}
        disabled={!removable && value <= min}
        onClick={() => onChange(value - 1)}
        className={`${btn} flex items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition active:scale-90 disabled:opacity-40`}
      >
        {showTrash ? <TrashIcon size={icon} className="text-rose-500" /> : <MinusIcon size={icon} />}
      </button>
      <span className={`min-w-8 text-center font-semibold ${size === "sm" ? "text-sm" : "text-base"}`}>
        {value}
      </span>
      <button
        type="button"
        aria-label="เพิ่มจำนวน"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={`${btn} flex items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition active:scale-90 disabled:opacity-40`}
      >
        <PlusIcon size={icon} />
      </button>
    </div>
  );
}
