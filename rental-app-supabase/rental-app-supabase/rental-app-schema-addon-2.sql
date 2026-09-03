-- ==========================================================
-- Addon 2 — รันไฟล์นี้ "ต่อจาก" rental-app-schema-addon.sql เดิม
-- เพิ่มสถานะ "รอยืนยันการโอน" และคอลัมน์เก็บ QR พร้อมเพย์จริง
-- ==========================================================

-- 1) เพิ่มคอลัมน์เก็บลิงก์รูป QR พร้อมเพย์จริงของเจ้าของบ้าน
alter table property_settings add column if not exists payment_qr_url text;

-- 2) เพิ่มสถานะใหม่ 'awaiting_confirmation' ให้ billing_cycles.status
--    (รอผู้เช่าแจ้งโอน -> รอเจ้าของบ้านยืนยัน -> ชำระแล้ว)
alter table billing_cycles drop constraint if exists billing_cycles_status_check;
alter table billing_cycles add constraint billing_cycles_status_check
  check (status in ('awaiting_reading', 'awaiting_payment', 'awaiting_confirmation', 'paid'));
