-- ==========================================================
-- Addon 9 — รันไฟล์นี้ "ต่อจาก" rental-app-schema-addon-8.sql เดิม
-- เพิ่มที่เก็บรูปสัญญาเช่าต่อห้อง (แนบได้หลายรูป/หลายหน้า)
-- ใช้ bucket "tenant-documents" เดิม (private อยู่แล้ว ไม่ต้องสร้างใหม่)
-- ==========================================================

alter table rooms add column if not exists lease_photo_paths text[] not null default '{}';
