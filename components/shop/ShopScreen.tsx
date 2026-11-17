"use client";

import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { CartBar } from "@/components/CartBar";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CartSheet } from "@/components/CartSheet";
import { CategoryTabs } from "@/components/CategoryTabs";
import { Header } from "@/components/Header";
import { SearchIcon } from "@/components/Icons";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { ProductSheet } from "@/components/ProductSheet";
import { PromoBanner } from "@/components/PromoBanner";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState, ErrorState, FullScreenLoader, Toast } from "@/components/StateViews";
import { useCart } from "@/hooks/useCart";
import { useLiff } from "@/hooks/useLiff";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/lib/types";

export function ShopScreen() {
  const liff = useLiff();
  const router = useRouter();
  const { status, categories, products, error, retry, isDemo: isDemoMenu } = useProducts();
  const cart = useCart();

  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string | null; tick: number }>({ msg: null, tick: 0 });

  const showToast = useCallback((msg: string) => {
    setToast((t) => ({ msg, tick: t.tick + 1 }));
  }, []);

  const qtyByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of cart.items) map[i.productId] = (map[i.productId] ?? 0) + i.quantity;
    return map;
  }, [cart.items]);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return products
      .filter((p) => category === "all" || p.category_id === category)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .sort((a, b) => Number(b.is_available) - Number(a.is_available) || a.sort_order - b.sort_order);
  }, [products, category, deferredQuery]);

  // จัดกลุ่มตามหมวดหมู่ (เรียงตามลำดับหมวด) แสดงเป็นหัวข้อแยกชัดเจน
  const groups = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => ({ category: c, items: visible.filter((p) => p.category_id === c.id) }))
        .filter((g) => g.items.length > 0),
    [categories, visible]
  );

  if (liff.status === "loading") return <FullScreenLoader label="กำลังเชื่อมต่อ LINE..." />;
  if (liff.status === "error") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white">
        <ErrorState
          title="เปิดร้านค้าไม่สำเร็จ"
          message={liff.error}
          onRetry={() => window.location.reload()}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-slate-50 pb-28 shadow-sm">
      <Header onCartClick={() => setCartOpen(true)} />

      <div className="-mt-2 rounded-t-3xl bg-slate-50">
        {(liff.isDemo || isDemoMenu) && (
          <p className="mx-4 mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
            โหมดทดสอบ:{" "}
            {[
              liff.isDemo && "ยังไม่ได้ตั้งค่า LIFF จึงใช้ผู้ใช้จำลอง",
              isDemoMenu && "ยังไม่ได้เชื่อม Supabase จึงแสดงเมนูตัวอย่าง",
            ]
              .filter(Boolean)
              .join(" / ")}
          </p>
        )}

        <PromoBanner />

        <div className="sticky top-[68px] z-20 space-y-3 bg-slate-50/95 pt-3 pb-2 backdrop-blur">
          <div className="px-4">
            <SearchBar value={query} onChange={setQuery} />
          </div>
          <CategoryTabs categories={categories} active={category} onChange={setCategory} />
        </div>

        <section className="px-4 pt-2">
          {status === "error" ? (
            <ErrorState title="โหลดเมนูไม่สำเร็จ" message={error} onRetry={retry} />
          ) : status === "loading" ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={36} />}
              title={query ? `ไม่พบเมนู "${query}"` : "ยังไม่มีเมนูในหมวดนี้"}
              description="ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูนะ"
              action={
                query || category !== "all"
                  ? { label: "ดูเมนูทั้งหมด", onClick: () => (setQuery(""), setCategory("all")) }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-6">
              {groups.map((g, gi) => (
                <div key={g.category.id} id={`cat-${g.category.slug}`}>
                  <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <CategoryIcon slug={g.category.slug} size={18} />
                    </span>
                    {g.category.name}
                    <span className="text-sm font-normal text-slate-400">{g.items.length} เมนู</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {g.items.map((p, i) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        inCart={qtyByProduct[p.id] ?? 0}
                        onSelect={setSelected}
                        priority={gi === 0 && i < 4}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {!cartOpen && !selected && <CartBar onClick={() => setCartOpen(true)} />}

      <ProductSheet
        product={selected}
        onClose={() => setSelected(null)}
        onAdded={(name) => showToast(`เพิ่ม ${name} ลงตะกร้าแล้ว`)}
      />
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => router.push("/checkout")}
      />
      <Toast message={toast.msg} tick={toast.tick} />
    </main>
  );
}
