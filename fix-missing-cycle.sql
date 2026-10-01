-- ==========================================================
-- สคริปต์กู้คืนรอบบิลที่หายไป (ใช้ตอนนี้ครั้งเดียว ไม่ใช่ addon ถาวร)
-- ใช้ตอนที่ห้องไหน "ยังไม่มีรอบบิลของห้องนี้" เพราะรอบบิลปัจจุบัน (ที่ยังไม่จ่าย)
-- ถูกลบไปโดยไม่ตั้งใจ (น่าจะลบจากหน้า Table Editor ตรงๆ ไม่ใช่จากปุ่มในแอป
-- เพราะปุ่ม "เลือกเพื่อลบ" ในแอปจะลบได้แค่ประวัติที่จ่ายแล้วเท่านั้น)
--
-- วิธีใช้: แก้ชื่อห้องในบรรทัด where r.label = 'มีสุข3' ให้ตรงกับห้องที่หาย
-- แล้ว Run ทีละห้อง ถ้ามีหลายห้องที่หาย ให้แก้ชื่อแล้ว Run ใหม่ทีละห้อง
-- ==========================================================

insert into billing_cycles (room_id, cycle_label, prev_water, prev_electric, rent, water_rate, electric_rate, status, due_date)
select
  r.id,
  (case extract(month from current_date)::int
    when 1 then 'ม.ค.' when 2 then 'ก.พ.' when 3 then 'มี.ค.' when 4 then 'เม.ย.'
    when 5 then 'พ.ค.' when 6 then 'มิ.ย.' when 7 then 'ก.ค.' when 8 then 'ส.ค.'
    when 9 then 'ก.ย.' when 10 then 'ต.ค.' when 11 then 'พ.ย.' when 12 then 'ธ.ค.'
  end) || ' ' || (extract(year from current_date)::int + 543),
  lastc.curr_water,
  lastc.curr_electric,
  r.rent,
  rt.water_rate,
  rt.electric_rate,
  'awaiting_reading',
  coalesce(lastc.due_date + interval '1 month', current_date + interval '7 days')::date
from rooms r
cross join rates rt
join lateral (
  select * from billing_cycles bc
  where bc.room_id = r.id and bc.status = 'paid'
  order by bc.paid_at desc nulls last, bc.created_at desc
  limit 1
) lastc on true
where r.label = 'มีสุข3' -- 👈 แก้ชื่อห้องตรงนี้ให้ตรงกับห้องที่หายรอบบิล
  and rt.id = 1
  and not exists (
    select 1 from billing_cycles bc2 where bc2.room_id = r.id and bc2.status <> 'paid'
  );

-- ตรวจสอบผลลัพธ์: ควรเห็น 1 แถวใหม่ที่ status = 'awaiting_reading'
select * from billing_cycles bc
join rooms r on r.id = bc.room_id
where r.label = 'มีสุข3'
order by bc.created_at desc;
