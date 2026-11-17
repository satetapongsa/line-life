"use client";

import { useCallback, useEffect, useState } from "react";
import { mapProductRow, PRODUCT_SELECT } from "@/lib/catalog";
import { demoCategories, demoProducts } from "@/lib/products";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";

type State = {
  status: "loading" | "ready" | "error";
  categories: Category[];
  products: Product[];
  error: string | null;
  /** true = ยังไม่ได้ตั้งค่า Supabase จึงใช้เมนูตัวอย่าง */
  isDemo: boolean;
};

async function fetchCatalog(): Promise<Omit<State, "status" | "error">> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { categories: demoCategories, products: demoProducts, isDemo: true };

  // อ่านด้วย anon key ได้เพราะ RLS เปิดให้ select อย่างเดียว
  const [cats, prods] = await Promise.all([
    supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
    supabase.from("products").select(PRODUCT_SELECT).order("sort_order"),
  ]);
  if (cats.error) throw cats.error;
  if (prods.error) throw prods.error;

  return {
    categories: cats.data as Category[],
    products: (prods.data ?? []).map(mapProductRow),
    isDemo: false,
  };
}

export function useProducts() {
  const [state, setState] = useState<State>({
    status: "loading",
    categories: [],
    products: [],
    error: null,
    isDemo: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchCatalog()
      .then((data) => !cancelled && setState({ ...data, status: "ready", error: null }))
      .catch((e: unknown) => {
        if (cancelled) return;
        console.error(e);
        setState((s) => ({
          ...s,
          status: "error",
          error: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    setAttempt((a) => a + 1);
  }, []);

  return { ...state, retry };
}
