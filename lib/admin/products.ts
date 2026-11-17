import "server-only";

import { ApiError, isUuid } from "../http";
import { getServiceSupabase } from "../supabase/server";

export type ProductInput = {
  name?: string;
  description?: string | null;
  price?: number;
  category_id?: string;
  image_url?: string | null;
  is_available?: boolean;
  sort_order?: number;
};

export type OptionFlags = { sizes?: boolean; sweetness?: boolean };

/** ตรวจข้อมูลสินค้าจากฟอร์มแอดมิน (partial = ใช้ตอนแก้ไข ส่งมาเฉพาะฟิลด์ที่เปลี่ยน) */
export function parseProductInput(body: unknown, partial: boolean): { input: ProductInput; flags: OptionFlags } {
  const b = (body ?? {}) as Record<string, unknown>;
  const input: ProductInput = {};
  const has = (k: string) => b[k] !== undefined;

  if (has("name") || !partial) {
    if (typeof b.name !== "string" || !b.name.trim() || b.name.trim().length > 100) {
      throw new ApiError(400, "กรุณากรอกชื่อสินค้า (ไม่เกิน 100 ตัวอักษร)");
    }
    input.name = b.name.trim();
  }
  if (has("description")) {
    if (b.description !== null && typeof b.description !== "string") throw new ApiError(400, "คำอธิบายไม่ถูกต้อง");
    const d = (b.description as string | null)?.trim() ?? "";
    if (d.length > 300) throw new ApiError(400, "คำอธิบายยาวเกิน 300 ตัวอักษร");
    input.description = d || null;
  }
  if (has("price") || !partial) {
    const price = Number(b.price);
    if (!Number.isFinite(price) || price < 0 || price > 100000) throw new ApiError(400, "ราคาไม่ถูกต้อง");
    input.price = Math.round(price * 100) / 100;
  }
  if (has("category_id") || !partial) {
    if (!isUuid(b.category_id)) throw new ApiError(400, "กรุณาเลือกหมวดหมู่");
    input.category_id = b.category_id;
  }
  if (has("image_url")) {
    if (b.image_url === null || b.image_url === "") input.image_url = null;
    else if (typeof b.image_url === "string" && /^https:\/\/\S+$/.test(b.image_url) && b.image_url.length < 1000) {
      input.image_url = b.image_url;
    } else throw new ApiError(400, "URL รูปต้องขึ้นต้นด้วย https://");
  }
  if (has("is_available")) {
    if (typeof b.is_available !== "boolean") throw new ApiError(400, "สถานะการขายไม่ถูกต้อง");
    input.is_available = b.is_available;
  }
  if (has("sort_order")) {
    const s = Number(b.sort_order);
    if (!Number.isInteger(s) || s < 0 || s > 9999) throw new ApiError(400, "ลำดับต้องเป็นจำนวนเต็ม 0-9999");
    input.sort_order = s;
  }

  const flags: OptionFlags = {};
  if (typeof b.sizes === "boolean") flags.sizes = b.sizes;
  if (typeof b.sweetness === "boolean") flags.sweetness = b.sweetness;
  return { input, flags };
}

const SIZE_SET = [
  { label: "S", price_delta: 0, sort_order: 0, is_default: true },
  { label: "M", price_delta: 10, sort_order: 1, is_default: false },
  { label: "L", price_delta: 20, sort_order: 2, is_default: false },
];
const SWEET_SET = ["0%", "25%", "50%", "100%"].map((label, i) => ({
  label,
  price_delta: 0,
  sort_order: i,
  is_default: label === "50%",
}));

/** เปิด/ปิดชุดตัวเลือกมาตรฐาน (ขนาด S/M/L, ความหวาน 0-100%) ของสินค้า */
export async function syncOptions(productId: string, flags: OptionFlags) {
  const supabase = getServiceSupabase();
  const groups = [
    { group: "size", enabled: flags.sizes, set: SIZE_SET },
    { group: "sweetness", enabled: flags.sweetness, set: SWEET_SET },
  ] as const;

  for (const { group, enabled, set } of groups) {
    if (enabled === undefined) continue;
    if (enabled) {
      const { error } = await supabase.from("product_options").upsert(
        set.map((o) => ({ ...o, product_id: productId, group_name: group })),
        { onConflict: "product_id,group_name,label", ignoreDuplicates: true }
      );
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("product_options")
        .delete()
        .eq("product_id", productId)
        .eq("group_name", group);
      if (error) throw error;
    }
  }
}
