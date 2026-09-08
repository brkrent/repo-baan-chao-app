-- ==========================================================
-- Addon 3 — รันไฟล์นี้ "ต่อจาก" rental-app-schema-addon-2.sql เดิม
-- เพิ่มระบบแนบรูปมิเตอร์ (เก็บแค่ 3 เดือนล่าสุดต่อห้อง แล้วลบรูปเก่าอัตโนมัติ)
-- ==========================================================

-- 1) เพิ่มคอลัมน์เก็บ "ที่อยู่ไฟล์" ของรูปมิเตอร์ (ไม่ใช่ตัวรูปเอง)
alter table billing_cycles add column if not exists water_photo_path text;
alter table billing_cycles add column if not exists electric_photo_path text;

-- 2) สร้างที่เก็บไฟล์ (bucket) สำหรับรูปมิเตอร์ — ตั้งเป็น private
--    (ไม่ public) เพราะรูปมิเตอร์อาจเห็นภายในห้อง ให้เข้าถึงได้เฉพาะ
--    เจ้าของบ้านกับผู้เช่าห้องนั้นเท่านั้น ผ่านลิงก์ชั่วคราว (signed URL)
insert into storage.buckets (id, name, public)
values ('meter-photos', 'meter-photos', false)
on conflict (id) do nothing;

-- 3) กำหนดสิทธิ์เข้าถึงไฟล์ในที่เก็บนี้
--    โครงสร้างพาธไฟล์คือ "<room_id>/<ชื่อไฟล์>" จึงใช้ชื่อโฟลเดอร์แรก
--    เทียบกับห้องที่ผู้เช่าคนนั้นเป็นเจ้าของ
create policy "meter-photos: landlord full access" on storage.objects
  for all using (bucket_id = 'meter-photos' and is_landlord())
  with check (bucket_id = 'meter-photos' and is_landlord());

create policy "meter-photos: tenant read own room" on storage.objects
  for select using (
    bucket_id = 'meter-photos'
    and (storage.foldername(name))[1] in (select id::text from rooms where tenant_id = auth.uid())
  );

create policy "meter-photos: tenant upload own room" on storage.objects
  for insert with check (
    bucket_id = 'meter-photos'
    and (storage.foldername(name))[1] in (select id::text from rooms where tenant_id = auth.uid())
  );

create policy "meter-photos: tenant update own room" on storage.objects
  for update using (
    bucket_id = 'meter-photos'
    and (storage.foldername(name))[1] in (select id::text from rooms where tenant_id = auth.uid())
  );
