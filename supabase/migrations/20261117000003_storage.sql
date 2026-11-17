-- Bucket สำหรับรูปสินค้า (public read)
-- อัปโหลดได้เฉพาะ server (service role) ผ่าน /api/admin/upload เท่านั้น
-- จึงไม่สร้าง policy insert/update/delete ให้ anon/authenticated

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
