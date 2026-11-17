-- ข้อมูลเริ่มต้น: หมวดหมู่ + เมนู (6 รายการเดิม + 2 รายการเสริม) + ตัวเลือก

insert into public.categories (name, slug, sort_order) values
  ('เครื่องดื่ม', 'drink',   1),
  ('เบเกอรี่',   'bakery',  2),
  ('ของหวาน',   'dessert', 3)
on conflict (slug) do nothing;

insert into public.products (category_id, name, description, price, image_url, sort_order)
select c.id, v.name, v.description, v.price, v.image_url, v.sort_order
from (values
  ('drink',   'ชาไทยเย็น',        'ชาไทยเข้มข้น หอมนม ชงสดทุกแก้ว',          45, 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=800&q=80&auto=format&fit=crop', 1),
  ('drink',   'กาแฟลาเต้',        'เอสเปรสโซ่คั่วกลาง ผสมนมสดนุ่มละมุน',      55, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80&auto=format&fit=crop', 2),
  ('drink',   'อเมริกาโน่เย็น',    'กาแฟดำเย็น รสชาติเข้ม สดชื่น',             50, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80&auto=format&fit=crop', 3),
  ('drink',   'น้ำส้มคั้น',        'ส้มคั้นสด 100% ไม่เติมน้ำตาล',             40, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80&auto=format&fit=crop', 4),
  ('bakery',  'ขนมปังปิ้ง',       'ขนมปังโฮมเมดปิ้งกรอบ เสิร์ฟพร้อมไข่ดาว',    35, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80&auto=format&fit=crop', 1),
  ('bakery',  'ครัวซองต์',        'เนยฝรั่งเศสแท้ อบใหม่ทุกเช้า กรอบนอกนุ่มใน', 65, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80&auto=format&fit=crop', 2),
  ('dessert', 'เค้กช็อกโกแลต',     'เค้กช็อกโกแลตเข้มข้น ราดกานาชเยิ้มๆ',       85, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80&auto=format&fit=crop', 1),
  ('dessert', 'บราวนี่ช็อกโกแลต',  'บราวนี่หนึบหนับ ช็อกโกแลตเข้มเต็มคำ',       60, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80&auto=format&fit=crop', 2)
) as v(category_slug, name, description, price, image_url, sort_order)
join public.categories c on c.slug = v.category_slug
where not exists (select 1 from public.products p where p.name = v.name);

-- ขนาด S/M/L สำหรับเครื่องดื่มทุกตัว
insert into public.product_options (product_id, group_name, label, price_delta, sort_order, is_default)
select p.id, 'size', s.label, s.delta, s.sort_order, s.is_default
from public.products p
join public.categories c on c.id = p.category_id and c.slug = 'drink'
cross join (values ('S', 0, 0, true), ('M', 10, 1, false), ('L', 20, 2, false))
  as s(label, delta, sort_order, is_default)
on conflict (product_id, group_name, label) do nothing;

-- ระดับความหวาน (ยกเว้นน้ำส้มคั้นที่ไม่เติมน้ำตาล)
insert into public.product_options (product_id, group_name, label, price_delta, sort_order, is_default)
select p.id, 'sweetness', s.label, 0, s.sort_order, s.is_default
from public.products p
join public.categories c on c.id = p.category_id and c.slug = 'drink'
cross join (values ('0%', 0, false), ('25%', 1, false), ('50%', 2, true), ('100%', 3, false))
  as s(label, sort_order, is_default)
where p.name <> 'น้ำส้มคั้น'
on conflict (product_id, group_name, label) do nothing;
