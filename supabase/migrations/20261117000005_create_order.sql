-- สร้างออเดอร์และรายการสินค้าใน transaction เดียว (ถ้าพังกลางทางจะ rollback ทั้งหมด)
-- ราคาถูกคำนวณจากฐานข้อมูลใน API route ฝั่ง server ก่อนเรียกฟังก์ชันนี้

create or replace function public.create_order(
  p_line_user_id text,
  p_display_name text,
  p_total        numeric,
  p_pickup_time  timestamptz,
  p_note         text,
  p_items        jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain at least one item';
  end if;

  insert into public.orders (line_user_id, display_name, total, pickup_time, note)
  values (p_line_user_id, p_display_name, p_total, p_pickup_time, nullif(p_note, ''))
  returning id into v_order_id;

  insert into public.order_items
    (order_id, product_id, product_name, unit_price, quantity, options, note, line_total)
  select
    v_order_id,
    (i ->> 'product_id')::uuid,
    i ->> 'product_name',
    (i ->> 'unit_price')::numeric,
    (i ->> 'quantity')::int,
    coalesce(i -> 'options', '[]'::jsonb),
    nullif(i ->> 'note', ''),
    (i ->> 'line_total')::numeric
  from jsonb_array_elements(p_items) as i;

  return v_order_id;
end;
$$;

-- ฟังก์ชันใน schema public ถูกเปิดผ่าน REST API อัตโนมัติ จึงต้องตัดสิทธิ์ anon/authenticated
revoke execute on function public.create_order(text, text, numeric, timestamptz, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_order(text, text, numeric, timestamptz, text, jsonb)
  to service_role;
