"use client";

import { CloseIcon, SearchIcon } from "./Icons";

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ค้นหาเมนู เช่น ชาไทย, ครัวซองต์"
        className="w-full rounded-2xl border-0 bg-white py-3 pr-10 pl-10 text-sm shadow-sm ring-1 ring-slate-200 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="ล้างคำค้นหา"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-slate-100 p-1 text-slate-500"
        >
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  );
}
