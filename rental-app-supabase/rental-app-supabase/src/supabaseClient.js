import { createClient } from "@supabase/supabase-js";

// ค่าเหล่านี้ "ปลอดภัยที่จะฝังในโค้ดฝั่งเว็บ" — anon/publishable key ถูกออกแบบมา
// ให้เปิดเผยได้ (ตัวที่ห้ามเปิดเผยเด็ดขาดคือ "service_role" key ซึ่งไม่ได้ใช้ในไฟล์นี้)
// ความปลอดภัยจริงๆ มาจาก Row Level Security (RLS) ที่ตั้งไว้ในฐานข้อมูลแล้ว

const SUPABASE_URL = "https://szlrattkvjrgipitqrsz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bHJhdHRrdmpyZ2lwaXRxcnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjQ0NjUsImV4cCI6MjEwNDAwMDQ2NX0.O8lDRAbH-MCN6GlEj03hlVS5hw5TkXKn_USIquQ9NOE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
