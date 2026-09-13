-- ==========================================================
-- Addon 7 — รันไฟล์นี้ "ต่อจาก" rental-app-schema-addon-6.sql เดิม
-- เพิ่มข้อมูลผู้เช่า: เบอร์โทร, LINE ID, รูปบัตรประชาชน (เก็บส่วนตัว)
-- ==========================================================

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists line_id text;
alter table profiles add column if not exists id_card_photo_path text;

-- เดิม profiles มีแค่ policy "select" ยังไม่มี policy ให้แก้ไขข้อมูลตัวเอง/ของผู้เช่าได้
create policy "profiles: update own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: landlord update any" on profiles
  for update using (is_landlord()) with check (is_landlord());

-- ที่เก็บไฟล์สำหรับรูปบัตรประชาชน — private เสมอ (ห้าม public)
-- โครงสร้างพาธไฟล์: "<user_id>/ชื่อไฟล์" เพื่อให้แต่ละคนเข้าถึงได้แค่โฟลเดอร์ตัวเอง
insert into storage.buckets (id, name, public)
values ('tenant-documents', 'tenant-documents', false)
on conflict (id) do nothing;

create policy "tenant-documents: landlord full access" on storage.objects
  for all using (bucket_id = 'tenant-documents' and is_landlord())
  with check (bucket_id = 'tenant-documents' and is_landlord());

create policy "tenant-documents: own folder read" on storage.objects
  for select using (bucket_id = 'tenant-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "tenant-documents: own folder insert" on storage.objects
  for insert with check (bucket_id = 'tenant-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "tenant-documents: own folder update" on storage.objects
  for update using (bucket_id = 'tenant-documents' and (storage.foldername(name))[1] = auth.uid()::text);
