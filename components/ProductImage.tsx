"use client";

import Image from "next/image";
import { useState } from "react";
import { CupIcon } from "./Icons";

const OPTIMIZED_HOSTS = ["images.unsplash.com"];

function canOptimize(url: string) {
  try {
    const { hostname, protocol } = new URL(url);
    return (
      protocol === "https:" &&
      (OPTIMIZED_HOSTS.includes(hostname) || hostname.endsWith(".supabase.co"))
    );
  } catch {
    return false;
  }
}

type Props = {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

/** รูปสินค้า พร้อม placeholder ตอนไม่มีรูปหรือโหลดรูปไม่สำเร็จ */
export function ProductImage({ src, alt, sizes, className = "", priority }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-brand-50 to-emerald-100 text-brand-500 ${className}`}>
        <CupIcon size={40} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={!canOptimize(src)}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
