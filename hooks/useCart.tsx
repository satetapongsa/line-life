"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cartUnitPrice } from "@/lib/format";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "wave-shop-cart-v1";
const MAX_QTY = 20;

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  /** เพิ่มขึ้นทุกครั้งที่มีการใส่ของลงตะกร้า ใช้ trigger animation */
  addedTick: number;
  addItem: (item: Omit<CartItem, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function cartKey(item: Pick<CartItem, "productId" | "options" | "note">) {
  const opts = item.options.map((o) => o.id).sort().join(",");
  return `${item.productId}|${opts}|${item.note.trim()}`;
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [addedTick, setAddedTick] = useState(0);

  // โหลดตะกร้าจาก localStorage หลัง mount (กัน hydration mismatch)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync จาก external storage ครั้งเดียว
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "key">) => {
    const key = cartKey(item);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + item.quantity) } : i
        );
      }
      return [...prev, { ...item, key, quantity: Math.min(MAX_QTY, item.quantity) }];
    });
    setAddedTick((t) => t + 1);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i))
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + cartUnitPrice(i) * i.quantity, 0);
    return { items, count, total, addedTick, addItem, setQuantity, removeItem, clear };
  }, [items, addedTick, addItem, setQuantity, removeItem, clear]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export { MAX_QTY };
