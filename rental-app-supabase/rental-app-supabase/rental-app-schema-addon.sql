-- ==========================================================
-- Addon schema — รันไฟล์นี้ "ต่อจาก" rental-app-schema.sql เดิม
-- (SQL Editor > New query > วางทั้งหมด > Run)
-- ==========================================================

-- 1) เพิ่มคอลัมน์รูปภาพห้อง
alter table rooms add column if not exists photo text;

-- 2) ตารางเก็บชื่อ/โลโก้ของอพาร์ตเมนต์
create table if not exists property_settings (
  id int primary key default 1,
  name text not null default 'อพาร์ตเมนต์ของฉัน',
  logo_url text,
  constraint single_row check (id = 1)
);
insert into property_settings (id) values (1) on conflict (id) do nothing;

alter table property_settings enable row level security;
create policy "property_settings: everyone can read" on property_settings
  for select using (auth.uid() is not null);
create policy "property_settings: landlord can update" on property_settings
  for update using (is_landlord()) with check (is_landlord());

-- ==========================================================
-- 3) นโยบายชั่วคราวสำหรับผู้เช่า — ให้กดชำระเงินจากแอปแล้วเปลี่ยนสถานะเป็น
--    'paid' ได้เอง เพราะตอนนี้ยังเป็นแค่หน้าจอจำลอง (mock) ยังไม่เชื่อมต่อ
--    payment gateway จริง
--
--    ⚠️ สำคัญ: เมื่อไหร่ที่ต่อ payment gateway จริงแล้ว (เช่น Omise/2C2P)
--    ให้ "ลบนโยบายสองอันนี้ทิ้ง" แล้วเปลี่ยนไปให้ Edge Function (โค้ดฝั่ง
--    เซิร์ฟเวอร์ที่ใช้ service_role key) เป็นคนตั้งสถานะ 'paid' แทน
--    หลังจากตรวจสอบผลชำระเงินจาก webhook ของ payment gateway เท่านั้น
--    ไม่งั้นผู้เช่าจะกดว่า "จ่ายแล้ว" ได้โดยไม่ต้องโอนเงินจริง
-- ==========================================================
create policy "billing_cycles: tenant update own (temp, remove when gateway is live)" on billing_cycles
  for update using (
    room_id in (select id from rooms where tenant_id = auth.uid())
  ) with check (
    room_id in (select id from rooms where tenant_id = auth.uid())
  );

create policy "payments: tenant insert own (temp, remove when gateway is live)" on payments
  for insert with check (
    billing_cycle_id in (
      select bc.id from billing_cycles bc
      join rooms r on r.id = bc.room_id
      where r.tenant_id = auth.uid()
    )
  );
