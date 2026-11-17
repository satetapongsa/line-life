"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { EditIcon, ImageIcon, PlusIcon, StoreIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { ClientApiError, useApi } from "@/hooks/useApi";
import { formatBaht } from "@/lib/format";
import { resizeImage } from "@/lib/image-resize";
import type { Category, Product } from "@/lib/types";

type Data = { products: Product[]; categories: Category[] };

export function ProductsTab() {
  const api = useApi();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api<Data>("/api/admin/products"));
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "โหลดสินค้าไม่สำเร็จ");
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดสินค้าจาก API
    load();
  }, [load]);

  function upsertLocal(p: Product) {
    setData((d) => {
      if (!d) return d;
      const exists = d.products.some((x) => x.id === p.id);
      const products = exists ? d.products.map((x) => (x.id === p.id ? p : x)) : [...d.products, p];
      return { ...d, products: products.sort((a, b) => a.sort_order - b.sort_order) };
    });
  }

  async function toggleAvailable(p: Product) {
    setToggling(p.id);
    try {
      const { product } = await api<{ product: Product }>(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        body: { is_available: !p.is_available },
      });
      upsertLocal(product);
    } catch (e) {
      alert(e instanceof ClientApiError ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setToggling(null);
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  const categoryName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? "-";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setEditing("new")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 py-3 font-semibold text-brand-600 active:scale-[0.99]"
      >
        <PlusIcon size={18} /> เพิ่มสินค้าใหม่
      </button>

      {data.products.length === 0 ? (
        <EmptyState icon={<StoreIcon size={36} />} title="ยังไม่มีสินค้า" />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {data.products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
              <ProductImage
                src={p.image_url}
                alt={p.name}
                sizes="64px"
                className={`h-16 w-16 shrink-0 rounded-xl ${p.is_available ? "" : "grayscale"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {categoryName(p.category_id)} · {formatBaht(p.price)}
                  {p.options.length > 0 && " · มีตัวเลือก"}
                </p>
                <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={p.is_available}
                    disabled={toggling === p.id}
                    onChange={() => toggleAvailable(p)}
                  />
                  <span className="relative h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-brand-500 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                  <span className={p.is_available ? "text-brand-600" : "text-slate-500"}>
                    {p.is_available ? "เปิดขาย" : "ปิดการขาย"}
                  </span>
                </label>
              </div>
              <button
                type="button"
                aria-label={`แก้ไข ${p.name}`}
                onClick={() => setEditing(p)}
                className="rounded-full bg-slate-100 p-2.5 text-slate-600 active:scale-95"
              >
                <EditIcon size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <BottomSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "เพิ่มสินค้า" : "แก้ไขสินค้า"}
      >
        {editing !== null && (
          <ProductForm
            key={editing === "new" ? "new" : editing.id}
            product={editing === "new" ? null : editing}
            categories={data.categories}
            onSaved={(p) => {
              upsertLocal(p);
              setEditing(null);
            }}
          />
        )}
      </BottomSheet>
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onSaved: (p: Product) => void;
}) {
  const api = useApi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    category_id: product?.category_id ?? categories[0]?.id ?? "",
    image_url: product?.image_url ?? "",
    sort_order: String(product?.sort_order ?? 0),
    is_available: product?.is_available ?? true,
    sizes: product ? product.options.some((o) => o.group_name === "size") : false,
    sweetness: product ? product.options.some((o) => o.group_name === "sweetness") : false,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const blob = await resizeImage(file);
      const fd = new FormData();
      fd.append("file", blob, "product.jpg");
      const { url } = await api<{ url: string }>("/api/admin/upload", { formData: fd });
      set("image_url", url);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : "อัปโหลดรูปไม่สำเร็จ ลองใช้ไฟล์ JPG/PNG");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category_id: form.category_id,
        image_url: form.image_url.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_available: form.is_available,
        sizes: form.sizes,
        sweetness: form.sweetness,
      };
      const { product: saved } = await api<{ product: Product }>(
        product ? `/api/admin/products/${product.id}` : "/api/admin/products",
        { method: product ? "PATCH" : "POST", body }
      );
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "บันทึกไม่สำเร็จ");
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-xl bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <form onSubmit={save} className="space-y-4 px-5 pb-6">
      <div className="flex items-center gap-3">
        <ProductImage src={form.image_url || null} alt="" sizes="96px" className="h-24 w-24 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium ring-1 ring-slate-200 disabled:opacity-60"
          >
            <ImageIcon size={16} /> {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
          </button>
          <input
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
            placeholder="หรือวาง URL รูป (https://...)"
            className={`${input} text-xs`}
          />
        </div>
      </div>

      <label className="block text-sm font-medium">
        ชื่อสินค้า
        <input required maxLength={100} value={form.name} onChange={(e) => set("name", e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="block text-sm font-medium">
        คำอธิบาย
        <textarea
          maxLength={300}
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={`${input} mt-1 resize-none`}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          ราคา (บาท)
          <input
            required
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            className={`${input} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium">
          ลำดับการแสดง
          <input
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => set("sort_order", e.target.value)}
            className={`${input} mt-1`}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        หมวดหมู่
        <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={`${input} mt-1`}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
        <legend className="sr-only">ตัวเลือกสินค้า</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.sizes} onChange={(e) => set("sizes", e.target.checked)} className="h-4 w-4 accent-brand-500" />
          มีตัวเลือกขนาด S / M (+10) / L (+20)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.sweetness}
            onChange={(e) => set("sweetness", e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          มีตัวเลือกความหวาน 0 / 25 / 50 / 100%
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_available}
            onChange={(e) => set("is_available", e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          เปิดขาย
        </label>
      </fieldset>

      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className="w-full rounded-full bg-brand-500 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/30 active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </form>
  );
}
