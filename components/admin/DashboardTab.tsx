"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshIcon } from "@/components/Icons";
import { ErrorState } from "@/components/StateViews";
import { ClientApiError, useApi } from "@/hooks/useApi";
import { formatBaht } from "@/lib/format";

type Stats = {
  salesToday: number;
  ordersToday: number;
  paidOrdersToday: number;
  awaitingConfirmation: number;
  inProgress: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
};

function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ring-1 ring-slate-100 ${accent ?? "bg-white"}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs opacity-70">{hint}</p>}
    </div>
  );
}

export function DashboardTab({ onOpenOrders }: { onOpenOrders: () => void }) {
  const api = useApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStats(await api<Stats>("/api/admin/dashboard"));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดสถิติจาก API
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  const max = Math.max(1, ...stats.topProducts.map((p) => p.quantity));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">วันนี้</h2>
        <button type="button" onClick={load} className="flex items-center gap-1 text-sm text-slate-500">
          <RefreshIcon size={14} /> รีเฟรช
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="ยอดขายวันนี้"
          value={formatBaht(stats.salesToday)}
          hint={`ชำระแล้ว ${stats.paidOrdersToday} ออเดอร์`}
          accent="bg-brand-500 text-white"
        />
        <StatCard label="ออเดอร์วันนี้" value={String(stats.ordersToday)} hint="ไม่รวมที่ยกเลิก" />
        <button type="button" onClick={onOpenOrders} className="text-left">
          <StatCard
            label="รอยืนยันชำระเงิน"
            value={String(stats.awaitingConfirmation)}
            hint="แตะเพื่อดูออเดอร์"
            accent={stats.awaitingConfirmation > 0 ? "bg-amber-50 text-amber-800" : "bg-white"}
          />
        </button>
        <StatCard label="กำลังทำ" value={String(stats.inProgress)} hint="ชำระแล้ว + กำลังเตรียม" />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-3 font-semibold">
          เมนูขายดี <span className="text-xs font-normal text-slate-400">7 วันล่าสุด</span>
        </h2>
        {stats.topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">ยังไม่มียอดขายในช่วงนี้</p>
        ) : (
          <ol className="space-y-3">
            {stats.topProducts.map((p, i) => (
              <li key={p.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">
                    {i + 1}. {p.name}
                  </span>
                  <span className="text-slate-500">
                    {p.quantity} ชิ้น · {formatBaht(p.revenue)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(p.quantity / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
