import { parseProductInput, syncOptions } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth";
import { mapProductRow, PRODUCT_SELECT } from "@/lib/catalog";
import { handle, json, readJson } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabase/server";

/** สินค้าทั้งหมด (รวมที่ปิดการขาย) + หมวดหมู่ สำหรับหน้าแอดมิน */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const supabase = getServiceSupabase();
    const [products, categories] = await Promise.all([
      supabase.from("products").select(PRODUCT_SELECT).order("sort_order"),
      supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
    ]);
    if (products.error) throw products.error;
    if (categories.error) throw categories.error;
    return json({ products: products.data.map(mapProductRow), categories: categories.data });
  });
}

/** เพิ่มสินค้าใหม่ */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const { input, flags } = parseProductInput(await readJson(req), false);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase.from("products").insert(input).select("id").single();
    if (error) throw error;
    await syncOptions(data.id, flags);

    const { data: row, error: readError } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", data.id)
      .single();
    if (readError) throw readError;
    return json({ product: mapProductRow(row) }, { status: 201 });
  });
}
