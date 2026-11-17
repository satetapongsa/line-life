import { parseProductInput, syncOptions } from "@/lib/admin/products";
import { requireAdmin } from "@/lib/auth";
import { mapProductRow, PRODUCT_SELECT } from "@/lib/catalog";
import { ApiError, handle, isUuid, json, readJson } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabase/server";

/** แก้ไขสินค้า / เปิด-ปิดการขาย (ไม่มีการลบ เพื่อไม่ให้ประวัติออเดอร์เสีย) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    if (!isUuid(id)) throw new ApiError(404, "ไม่พบสินค้า");

    const { input, flags } = parseProductInput(await readJson(req), true);
    const supabase = getServiceSupabase();

    if (Object.keys(input).length > 0) {
      const { data, error } = await supabase.from("products").update(input).eq("id", id).select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new ApiError(404, "ไม่พบสินค้า");
    }
    await syncOptions(id, flags);

    const { data: row, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!row) throw new ApiError(404, "ไม่พบสินค้า");
    return json({ product: mapProductRow(row) });
  });
}
