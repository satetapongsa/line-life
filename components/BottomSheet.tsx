"use client";

import { useEffect } from "react";
import { CloseIcon } from "./Icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function BottomSheet({ open, onClose, title, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="ปิด"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-[2px]"
      />
      <div className="relative flex max-h-[92dvh] w-full max-w-md animate-sheet-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between px-5 pt-3 pb-2">
          <div className="absolute top-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-slate-200" />
          <h2 className="mt-2 text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="mt-2 rounded-full bg-slate-100 p-1.5 text-slate-500 active:scale-95"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="pb-safe shrink-0 border-t border-slate-100 bg-white px-5 pt-3">{footer}</div>}
      </div>
    </div>
  );
}
