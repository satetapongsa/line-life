import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, json } from "@/lib/http";
import { getServiceSupabase, PRODUCT_IMAGE_BUCKET } from "@/lib/supabase/server";

// Vercel จำกัด request body ~4.5 MB (ฝั่งหน้าเว็บย่อรูปก่อนอัปโหลดอยู่แล้ว)
const MAX_BYTES = 4 * 1024 * 1024;

/** ตรวจชนิดไฟล์จาก magic bytes จริง ไม่เชื่อ Content-Type/นามสกุลที่ client ส่งมา */
function detectImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mime: "image/png", ext: "png" };
  }
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

/** อัปโหลดรูปสินค้าขึ้น Supabase Storage (เฉพาะแอดมิน) */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin(req);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "กรุณาเลือกไฟล์รูป");
    if (file.size === 0 || file.size > MAX_BYTES) throw new ApiError(413, "ไฟล์รูปต้องมีขนาดไม่เกิน 4 MB");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) throw new ApiError(415, "รองรับเฉพาะไฟล์ JPG, PNG และ WEBP");

    // ตั้งชื่อไฟล์ใหม่เองทั้งหมด กัน path traversal / เขียนทับไฟล์เดิม
    const path = `products/${crypto.randomUUID()}.${type.ext}`;
    const supabase = getServiceSupabase();
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, bytes, {
      contentType: type.mime,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    return json({ url: data.publicUrl }, { status: 201 });
  });
}
