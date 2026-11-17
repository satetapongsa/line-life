"use client";

import { useState } from "react";
import { CupIcon } from "./Icons";

/** โลโก้ร้านจาก public/logo.png ถ้ายังไม่มีไฟล์จะแสดงไอคอนแทน */
export function Logo({ size = 40 }: { size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-xl bg-white text-brand-500 shadow-sm"
      >
        <CupIcon size={size * 0.6} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ต้องการ onError fallback ตอนยังไม่มีไฟล์โลโก้
    <img
      src="/logo.png"
      alt="Wave Shop"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-xl bg-white object-cover shadow-sm"
      style={{ width: size, height: size }}
    />
  );
}
