-- เพิ่มเมนูให้แต่ละหมวดมีอย่างน้อย 6 รายการ (รันซ้ำได้ ไม่สร้างข้อมูลซ้ำ)
-- เครื่องดื่ม 7 / เบเกอรี่ 6 / ของหวาน 6

insert into public.products (category_id, name, description, price, image_url, sort_order)
select c.id, v.name, v.description, v.price, v.image_url, v.sort_order
from (values
  ('drink',   'คาปูชิโน่ร้อน',            'ฟองนมหนานุ่ม หอมกาแฟคั่วเข้ม',                  55, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80&auto=format&fit=crop', 5),
  ('drink',   'ชามะนาวเย็น',             'ชาเข้มผสมมะนาวสด เปรี้ยวหวานสดชื่น',             45, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80&auto=format&fit=crop', 6),
  ('drink',   'สมูทตี้ผลไม้รวม',          'ปั่นสดจากผลไม้ตามฤดูกาล ไม่ใส่น้ำเชื่อม',         60, 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80&auto=format&fit=crop', 7),
  ('bakery',  'ขนมปังซาวร์โดว์',          'หมักธรรมชาติ เปลือกกรอบ เนื้อนุ่มเคี้ยวหนึบ',       95, 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&q=80&auto=format&fit=crop', 3),
  ('bakery',  'โดนัทเคลือบช็อกโกแลต',     'โดนัทนุ่มฟู เคลือบช็อกโกแลตโรยสปริงเคิล',          45, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80&auto=format&fit=crop', 4),
  ('bakery',  'คุกกี้ช็อกชิป',            'กรอบนอกนุ่มใน ช็อกโกแลตชิปเต็มเม็ด',             35, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80&auto=format&fit=crop', 5),
  ('bakery',  'แซนด์วิชแฮมชีส',          'ขนมปังโฮลวีท แฮม ชีส ผักสดกรอบ',                75, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&q=80&auto=format&fit=crop', 6),
  ('dessert', 'ทีรามิสุ',                'ชั้นครีมมาสคาร์โปเนกับเลดี้ฟิงเกอร์ชุบกาแฟ',       110, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&q=80&auto=format&fit=crop', 3),
  ('dessert', 'เครปสตรอว์เบอร์รี่',       'แป้งเครปบางนุ่ม ท็อปวิปครีมและสตรอว์เบอร์รี่สด',   75, 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&q=80&auto=format&fit=crop', 4),
  ('dessert', 'พานาคอตต้าสตรอว์เบอร์รี่', 'พุดดิ้งนมเนียนนุ่ม เสิร์ฟพร้อมซอสสตรอว์เบอร์รี่',  80, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80&auto=format&fit=crop', 5),
  ('dessert', 'ไอศกรีมโคน',              'ไอศกรีมโฮมเมด เลือกรสตามที่ร้านมีวันนี้',          50, 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80&auto=format&fit=crop', 6)
) as v(category_slug, name, description, price, image_url, sort_order)
join public.categories c on c.slug = v.category_slug
where not exists (select 1 from public.products p where p.name = v.name);

-- ขนาด S/M/L สำหรับเครื่องดื่มใหม่
insert into public.product_options (product_id, group_name, label, price_delta, sort_order, is_default)
select p.id, 'size', s.label, s.delta, s.sort_order, s.is_default
from public.products p
cross join (values ('S', 0, 0, true), ('M', 10, 1, false), ('L', 20, 2, false))
  as s(label, delta, sort_order, is_default)
where p.name in ('คาปูชิโน่ร้อน', 'ชามะนาวเย็น', 'สมูทตี้ผลไม้รวม')
on conflict (product_id, group_name, label) do nothing;

-- ระดับความหวาน (สมูทตี้ไม่ใส่น้ำเชื่อมจึงไม่มีตัวเลือกนี้)
insert into public.product_options (product_id, group_name, label, price_delta, sort_order, is_default)
select p.id, 'sweetness', s.label, 0, s.sort_order, s.is_default
from public.products p
cross join (values ('0%', 0, false), ('25%', 1, false), ('50%', 2, true), ('100%', 3, false))
  as s(label, sort_order, is_default)
where p.name in ('คาปูชิโน่ร้อน', 'ชามะนาวเย็น')
on conflict (product_id, group_name, label) do nothing;
