"use client";

import type { Category } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";

type Props = {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
};

export function CategoryTabs({ categories, active, onChange }: Props) {
  const tabs = [{ id: "all", name: "ทั้งหมด", slug: "all" }, ...categories];

  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-1" aria-label="หมวดหมู่">
      {tabs.map((c) => {
        const selected = c.id === active;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            aria-pressed={selected}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 ${
              selected
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            <CategoryIcon slug={c.slug} size={16} />
            {c.name}
          </button>
        );
      })}
    </nav>
  );
}
