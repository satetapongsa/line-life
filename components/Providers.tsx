"use client";

import { CartProvider } from "@/hooks/useCart";
import { LiffProvider } from "@/hooks/useLiff";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LiffProvider>
      <CartProvider>{children}</CartProvider>
    </LiffProvider>
  );
}
