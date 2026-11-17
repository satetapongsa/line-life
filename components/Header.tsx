"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useLiff } from "@/hooks/useLiff";
import { CartIcon, ReceiptIcon } from "./Icons";
import { Logo } from "./Logo";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { profile } = useLiff();
  const { count, addedTick } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-brand-500 px-4 pt-3 pb-4 text-white">
      <div className="flex items-center gap-3">
        <Logo size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-tight font-bold tracking-tight">Wave Shop</p>
          <p className="truncate text-xs text-white/85">
            สวัสดี, {profile?.displayName ?? "ลูกค้า"}
          </p>
        </div>

        <Link
          href="/orders"
          aria-label="ออเดอร์ของฉัน"
          className="rounded-full bg-white/15 p-2.5 transition active:scale-95"
        >
          <ReceiptIcon size={20} />
        </Link>

        <button
          type="button"
          onClick={onCartClick}
          aria-label={`ตะกร้า ${count} ชิ้น`}
          className="relative rounded-full bg-white/15 p-2.5 transition active:scale-95"
        >
          <span key={addedTick} className={addedTick ? "block animate-bump" : "block"}>
            <CartIcon size={20} />
          </span>
          {count > 0 && (
            <span
              key={`b-${count}`}
              className="absolute -top-1 -right-1 flex h-5 min-w-5 animate-pop-in items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-600 shadow"
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>

        {profile?.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- รูปโปรไฟล์จาก LINE CDN
          <img
            src={profile.pictureUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full border-2 border-white/80 object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/60 bg-white/20 text-sm font-semibold">
            {profile?.displayName?.charAt(0) ?? "?"}
          </div>
        )}
      </div>
    </header>
  );
}
