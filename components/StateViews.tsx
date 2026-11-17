"use client";

import { AlertIcon, RefreshIcon } from "./Icons";

type Action = { label: string; onClick: () => void };

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: Action;
}) {
  return (
    <div className="flex animate-fade-in flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        {icon}
      </div>
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "เกิดข้อผิดพลาด",
  message,
  onRetry,
  retryLabel = "ลองใหม่อีกครั้ง",
}: {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex animate-fade-in flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <AlertIcon size={36} />
      </div>
      <p className="text-base font-semibold">{title}</p>
      {message && <p className="mt-1 max-w-xs text-sm break-words text-slate-500">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <RefreshIcon size={16} /> {retryLabel}
        </button>
      )}
    </div>
  );
}

export function FullScreenLoader({ label = "กำลังโหลด..." }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white">
      <div className="h-11 w-11 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function Toast({ message, tick }: { message: string | null; tick: number }) {
  if (!message) return null;
  return (
    <div
      key={tick}
      role="status"
      className="pointer-events-none fixed bottom-28 left-1/2 z-[60] animate-toast rounded-full bg-slate-900/90 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-white shadow-lg"
    >
      {message}
    </div>
  );
}
