"use client";

import { useCallback, useEffect, useState } from "react";
import { ChartIcon, CheckIcon, CopyIcon, LockIcon, ReceiptIcon, StoreIcon } from "@/components/Icons";
import { PageShell } from "@/components/PageShell";
import { ErrorState, FullScreenLoader } from "@/components/StateViews";
import { ClientApiError, useApi } from "@/hooks/useApi";
import { DashboardTab } from "./DashboardTab";
import { OrdersTab } from "./OrdersTab";
import { ProductsTab } from "./ProductsTab";

type Me = { userId: string; displayName: string; isAdmin: boolean };
type Tab = "dashboard" | "orders" | "products";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "ภาพรวม", icon: <ChartIcon size={18} /> },
  { id: "orders", label: "ออเดอร์", icon: <ReceiptIcon size={18} /> },
  { id: "products", label: "สินค้า", icon: <StoreIcon size={18} /> },
];

export function AdminScreen() {
  const api = useApi();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [copied, setCopied] = useState(false);

  const check = useCallback(async () => {
    setError(null);
    try {
      setMe(await api<Me>("/api/admin/me"));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "ตรวจสอบสิทธิ์ไม่สำเร็จ");
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ตรวจสิทธิ์จาก API ตอนเปิดหน้า
    check();
  }, [check]);

  if (error) {
    return (
      <PageShell title="หลังร้าน">
        <ErrorState title="เข้าหน้าแอดมินไม่สำเร็จ" message={error} onRetry={check} />
      </PageShell>
    );
  }
  if (!me) return <FullScreenLoader label="กำลังตรวจสอบสิทธิ์..." />;

  if (!me.isAdmin) {
    return (
      <PageShell title="หลังร้าน">
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <LockIcon size={36} />
          </div>
          <p className="font-semibold">หน้านี้สำหรับเจ้าของร้านเท่านั้น</p>
          <p className="mt-1 text-sm text-slate-500">
            ถ้าคุณเป็นเจ้าของร้าน ให้นำ LINE userId ด้านล่างไปใส่ใน env <code>ADMIN_LINE_USER_IDS</code> แล้ว deploy ใหม่
          </p>
          <code className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs break-all">{me.userId}</code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard?.writeText(me.userId).catch(() => {});
              setCopied(true);
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium ring-1 ring-slate-200 active:scale-95"
          >
            {copied ? <CheckIcon size={16} className="text-brand-600" /> : <CopyIcon size={16} />}
            {copied ? "คัดลอกแล้ว" : "คัดลอก userId"}
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="หลังร้าน Wave Shop" wide>
      <nav className="sticky top-[57px] z-20 flex gap-1 border-b border-slate-100 bg-white px-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-sm font-medium transition ${
              tab === t.id ? "border-brand-500 text-brand-600" : "border-transparent text-slate-500"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>
      <div className="p-4">
        {tab === "dashboard" && <DashboardTab onOpenOrders={() => setTab("orders")} />}
        {tab === "orders" && <OrdersTab />}
        {tab === "products" && <ProductsTab />}
      </div>
    </PageShell>
  );
}
