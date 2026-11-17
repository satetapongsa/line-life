-- Wave Shop: ตารางหลักของร้าน

-- อัปเดต updated_at อัตโนมัติ
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- หมวดหมู่สินค้า
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- สินค้า
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories (id) on delete restrict,
  name          text not null check (char_length(name) between 1 and 100),
  description   text check (char_length(description) <= 300),
  price         numeric(10, 2) not null check (price >= 0),
  image_url     text,
  is_available  boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index products_category_idx on public.products (category_id, sort_order);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ตัวเลือกของสินค้า (ขนาด / ความหวาน)
create table public.product_options (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  group_name   text not null check (group_name in ('size', 'sweetness')),
  label        text not null,
  price_delta  numeric(10, 2) not null default 0 check (price_delta >= 0),
  sort_order   int not null default 0,
  is_default   boolean not null default false,
  unique (product_id, group_name, label)
);
create index product_options_product_idx on public.product_options (product_id);

-- ออเดอร์
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        bigint generated always as identity unique,
  line_user_id    text not null,
  display_name    text not null,
  status          text not null default 'pending'
                  check (status in ('pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid', 'reported', 'paid')),
  total           numeric(10, 2) not null check (total >= 0),
  pickup_time     timestamptz not null,
  note            text check (char_length(note) <= 300),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index orders_user_idx on public.orders (line_user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- รายการในออเดอร์ (เก็บชื่อ/ราคา ณ ตอนสั่ง เผื่อสินค้าถูกแก้ไขภายหลัง)
create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  product_name  text not null,
  unit_price    numeric(10, 2) not null check (unit_price >= 0),
  quantity      int not null check (quantity between 1 and 20),
  options       jsonb not null default '[]'::jsonb,
  note          text check (char_length(note) <= 100),
  line_total    numeric(10, 2) not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
