-- ==========================================================
-- Addon 5 — รันไฟล์นี้ "ต่อจาก" rental-app-schema-addon-4.sql เดิม
-- เพิ่มคอลัมน์คำอธิบายสินค้า
-- ==========================================================

alter table products add column if not exists description text;
