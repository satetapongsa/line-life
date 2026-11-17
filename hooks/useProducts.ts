"use client";

import { useCallback, useEffect, useState } from "react";
import { demoCategories, demoProducts } from "@/lib/products";
import type { Category, Product } from "@/lib/types";

type State = {
  status: "loading" | "ready" | "error";
  categories: Category[];
  products: Product[];
  error: string | null;
};

export function useProducts() {
  const [state, setState] = useState<State>({
    status: "loading",
    categories: [],
    products: [],
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // TODO: ดึงจาก Supabase
    Promise.resolve().then(() => {
      if (cancelled) return;
      setState({ status: "ready", categories: demoCategories, products: demoProducts, error: null });
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
