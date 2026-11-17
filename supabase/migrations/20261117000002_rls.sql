-- Row Level Security
-- - categories / products / product_options: ทุกคนอ่านได้อย่างเดียว
-- - orders / order_items: ไม่มี policy ให้ anon/authenticated เลย
--   ต้องเขียน/อ่านผ่าน API route ฝั่ง server ที่ใช้ service role เท่านั้น

alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.product_options enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;

create policy "categories are readable by everyone"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "products are readable by everyone"
  on public.products for select
  to anon, authenticated
  using (true);

create policy "product options are readable by everyone"
  on public.product_options for select
  to anon, authenticated
  using (true);

-- กันไว้อีกชั้น: ตัดสิทธิ์เขียนของ role ฝั่ง client ออกทั้งหมด
revoke insert, update, delete, truncate on
  public.categories, public.products, public.product_options
  from anon, authenticated;

revoke all on public.orders, public.order_items from anon, authenticated;
