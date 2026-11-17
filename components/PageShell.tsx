"use client";

import Link from "next/link";
import { useLiff } from "@/hooks/useLiff";
import { ChevronLeftIcon } from "./Icons";
import { ErrorState, FullScreenLoader } from "./StateViews";

type Props = {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
};

/** โครงหน้าย่อย: แถบหัวพร้อมปุ่มย้อนกลับ + รอ LIFF พร้อมก่อนแสดงเนื้อหา */
export function PageShell({ title, backHref = "/", right, children, wide }: Props) {
  const liff = useLiff();

  if (liff.status === "loading") return <FullScreenLoader label="กำลังเชื่อมต่อ LINE..." />;
  if (liff.status === "error") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white">
        <ErrorState title="เปิดหน้านี้ไม่สำเร็จ" message={liff.error} onRetry={() => window.location.reload()} />
      </main>
    );
  }

  return (
    <main className={`mx-auto min-h-dvh bg-slate-50 pb-10 ${wide ? "max-w-3xl" : "max-w-md"}`}>
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-100 bg-white/95 px-2 py-2.5 backdrop-blur">
        <Link
          href={backHref}
          aria-label="ย้อนกลับ"
          className="rounded-full p-2 text-slate-700 transition hover:bg-slate-100 active:scale-95"
        >
          <ChevronLeftIcon size={22} />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
        {right}
      </header>
      {children}
    </main>
  );
}
