// Edge Function: change-tenant-password
// วางโค้ดนี้ใน Supabase Dashboard > Edge Functions > Deploy a new function > Via Editor

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword || String(newPassword).length < 6) {
      return new Response(
        JSON.stringify({ error: "ข้อมูลไม่ครบ หรือรหัสผ่านสั้นเกินไป (ต้องอย่างน้อย 6 ตัวอักษร)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "ไม่พบสิทธิ์การเข้าถึง" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ไคลเอนต์ตัวนี้ใช้ token ของ "คนที่กำลังเรียกฟังก์ชันนี้อยู่" เพื่อเช็คว่าเป็นเจ้าของบ้านจริงไหม
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_ANON_KEY"),
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "ยืนยันตัวตนไม่สำเร็จ" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profile?.role !== "landlord") {
      return new Response(JSON.stringify({ error: "เฉพาะเจ้าของบ้านเท่านั้นที่ทำรายการนี้ได้" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ไคลเอนต์ตัวนี้ใช้กุญแจลับระดับแอดมิน (service role) เพื่อแก้รหัสผ่านของ "คนอื่น" ได้จริง
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
