-- เพิ่มเมนูให้ครบหมวดละ 10 รายการ (เครื่องดื่ม/เบเกอรี่/ของหวาน) และเปลี่ยนรูปชาไทยเย็นเป็นรูปชาไทยจริง
-- รันซ้ำได้ ไม่สร้างข้อมูลซ้ำ

update public.products
set image_url = 'https://images.unsplash.com/photo-1644031995386-fe9665dc5b57?w=800&q=80&auto=format&fit=crop'
where name = 'ชาไทยเย็น' and image_url like '%1558857563-b371033873b8%';

insert into public.products (category_id, name, description, price, image_url, sort_order)
select c.id, v.name, v.description, v.price, v.image_url, v.sort_order
from (values
  ('drink', 'มัทฉะลาเต้เย็น', 'มัทฉะญี่ปุ่นแท้ ผสมนมสดเย็นชื่นใจ', 65, 'https://images.unsplash.com/photo-1717603545758-88cc454db69b?w=800&q=80&auto=format&fit=crop', 8),
  ('drink', 'โกโก้ปั่นเย็น', 'โกโก้เข้มข้น ปั่นเนียน โรยช็อกโกแลตชิป', 60, 'https://images.unsplash.com/photo-1586195831800-24f14c992cea?w=800&q=80&auto=format&fit=crop', 9),
  ('drink', 'ไอซ์ลาเต้', 'เอสเปรสโซ่ราดนมสดเย็น ชุ่มคอ', 55, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&q=80&auto=format&fit=crop', 10),
  ('bakery', 'มัฟฟินบลูเบอร์รี่', 'มัฟฟินนุ่มฟู อัดแน่นบลูเบอร์รี่', 55, 'https://images.unsplash.com/photo-1637087788449-222cf1da072a?w=800&q=80&auto=format&fit=crop', 7),
  ('bakery', 'ซินนามอนโรล', 'โรลอบอุ่นหอมอบเชย ราดไอซิ่งครีมชีส', 65, 'https://images.unsplash.com/photo-1764281469526-e1c378515e6f?w=800&q=80&auto=format&fit=crop', 8),
  ('bakery', 'เบเกิลครีมชีส', 'เบเกิลเหนียวนุ่ม ทาครีมชีสเต็มหน้า', 70, 'https://images.unsplash.com/photo-1643049441000-3249ab096f2b?w=800&q=80&auto=format&fit=crop', 9),
  ('bakery', 'ขนมปังบาแก็ตต์', 'เปลือกกรอบ ไส้นุ่ม อบสดใหม่ทุกเช้า', 45, 'https://images.unsplash.com/photo-1768203631935-da182455aa6d?w=800&q=80&auto=format&fit=crop', 10),
  ('dessert', 'แพนเค้กบลูเบอร์รี่', 'แพนเค้กนุ่มฟู ราดน้ำผึ้งและบลูเบอร์รี่', 75, 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80&auto=format&fit=crop', 7),
  ('dessert', 'เฟรนช์โทสต์บลูเบอร์รี่', 'ขนมปังชุบไข่ทอดหอม เสิร์ฟพร้อมกล้วยและบลูเบอร์รี่', 85, 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80&auto=format&fit=crop', 8),
  ('dessert', 'ทาร์ตเลมอนเมอแรงก์', 'ทาร์ตเปรี้ยวหวาน ท็อปเมอแรงก์ไหม้เกรียมหอม', 90, 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&q=80&auto=format&fit=crop', 9),
  ('dessert', 'ชีสเค้กเนยสด', 'ชีสเค้กเนื้อเนียนนุ่ม ฐานบิสกิตกรอบ', 95, 'https://images.unsplash.com/photo-1708175313856-8573b2bf8a3a?w=800&q=80&auto=format&fit=crop', 10)
) as v(category_slug, name, description, price, image_url, sort_order)
join public.categories c on c.slug = v.category_slug
where not exists (select 1 from public.products p where p.name = v.name);

-- ขนาด S/M/L และความหวานของเครื่องดื่มใหม่
insert into public.product_options (product_id, group_name, label, price_delta, sort_order, is_default)
select p.id, 'size', s.label, s.delta, s.sort_order, s.is_default
from public.products p
cross join (values ('S', 0, 0, true), ('M', 10, 1, false), ('L', 20, 2, false))
  as s(label, delta, sort_order, is_default)
where p.name in ('มัทฉะลาเต้เย็น', 'โกโก้ปั่นเย็น', 'ไอซ์ลาเต้')
on conflict (product_id, group_name, label) do nothing;

insert into public.product_options (product_id, group_name, label, price_delta, sort_order, is_default)
select p.id, 'sweetness', s.label, 0, s.sort_order, s.is_default
from public.products p
cross join (values ('0%', 0, false), ('25%', 1, false), ('50%', 2, true), ('100%', 3, false))
  as s(label, sort_order, is_default)
where p.name in ('มัทฉะลาเต้เย็น', 'โกโก้ปั่นเย็น', 'ไอซ์ลาเต้')
on conflict (product_id, group_name, label) do nothing;
