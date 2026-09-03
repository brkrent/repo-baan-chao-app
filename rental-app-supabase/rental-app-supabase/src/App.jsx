import React, { useEffect, useState, useCallback } from "react";
import {
  Home, Droplet, Zap, Settings, X, CheckCircle2, QrCode,
  Wallet, LogOut, History, Lock, Mail, Image as ImageIcon, Pencil, Plus, Loader2,
} from "lucide-react";
import { supabase } from "./supabaseClient";

// ---------- design tokens ----------
const C = {
  navy: "#16263B", navySoft: "#233B57", paper: "#EEF0E8", card: "#FFFFFF",
  ink: "#1A2029", inkSoft: "#5B6472", water: "#2F7A87", waterSoft: "#DCEEF0",
  electric: "#C88A1F", electricSoft: "#F6E9D2", success: "#3F8F5F", successSoft: "#DFF0E5",
  alert: "#C1571F", alertSoft: "#F5E1D6", line: "#DDD9CC",
};
const display = { fontFamily: "'Space Grotesk', 'Inter', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const baht = (n) => Math.round(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
// รหัส ID ของผู้ใช้แต่ละคน (เช่น "1a", "landlord") จะถูกแปลงเป็นอีเมลปลอมด้วยโดเมนนี้
// เพื่อให้ใช้กับระบบ auth ของ Supabase ได้โดยไม่ต้องมีอีเมลจริง
const LOGIN_DOMAIN = "baanchao.local";
const idToEmail = (id) => `${id.trim().toLowerCase()}@${LOGIN_DOMAIN}`;

function currentCycleLabel() {
  const d = new Date();
  return `${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function calcCycleBill(cycle) {
  if (!cycle) return null;
  const waterUnits = Math.max(0, (cycle.curr_water ?? cycle.prev_water) - cycle.prev_water);
  const electricUnits = Math.max(0, (cycle.curr_electric ?? cycle.prev_electric) - cycle.prev_electric);
  const waterCost = waterUnits * cycle.water_rate;
  const electricCost = electricUnits * cycle.electric_rate;
  return { waterUnits, electricUnits, waterCost, electricCost, total: Number(cycle.rent) + waterCost + electricCost };
}

// ---------- small presentational pieces ----------
function Gauge({ value, max, color, softColor, icon: Icon, label, unitLabel }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const zoneColor = pct < 0.5 ? color : pct < 0.8 ? C.electric : C.alert;
  const needleDeg = -90 + pct * 180;
  return (
    <div className="rounded-2xl p-4 flex flex-col items-center" style={{ background: softColor, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 mb-1 self-start">
        <Icon size={16} color={color} />
        <span className="text-xs font-medium" style={{ color: C.inkSoft, ...display }}>{label}</span>
      </div>
      <div className="relative w-full" style={{ maxWidth: 180 }}>
        <svg viewBox="0 0 200 115" className="w-full">
          <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" pathLength="100" />
          <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke={zoneColor} strokeWidth="14" strokeLinecap="round" pathLength="100" strokeDasharray={`${pct * 100} 100`} />
          <line x1="100" y1="105" x2="100" y2="35" stroke={C.ink} strokeWidth="3" strokeLinecap="round"
            style={{ transform: `rotate(${needleDeg}deg)`, transformOrigin: "100px 105px", transition: "transform 0.4s ease" }} />
          <circle cx="100" cy="105" r="6" fill={C.ink} />
        </svg>
      </div>
      <div className="text-center -mt-1">
        <div className="text-2xl font-bold" style={mono}>{value}</div>
        <div className="text-[11px]" style={{ color: C.inkSoft }}>{unitLabel}</div>
      </div>
    </div>
  );
}
function Badge({ status }) {
  const meta = {
    awaiting_reading: { text: "รอกรอกมิเตอร์", bg: C.alertSoft, fg: C.alert },
    awaiting_payment: { text: "รอชำระเงิน", bg: C.electricSoft, fg: C.electric },
    awaiting_confirmation: { text: "รอยืนยันการโอน", bg: C.alertSoft, fg: C.alert },
    paid: { text: "ชำระแล้ว", bg: C.successSoft, fg: C.success },
  }[status] || { text: status, bg: C.paper, fg: C.inkSoft };
  return <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: meta.bg, color: meta.fg }}>{meta.text}</span>;
}
function Row({ label, value }) {
  return (<div className="flex items-center justify-between"><span style={{ color: C.inkSoft }}>{label}</span><span style={mono}>{value}</span></div>);
}
function MeterCompare({ cycle }) {
  return (
    <div className="rounded-xl p-3 mb-3 space-y-1.5" style={{ background: C.paper }}>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1" style={{ color: C.inkSoft }}><Droplet size={12} color={C.water} /> เลขมิเตอร์น้ำ (เก่า → ใหม่)</span>
        <span style={mono}>{cycle.prev_water} → {cycle.curr_water ?? "-"}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1" style={{ color: C.inkSoft }}><Zap size={12} color={C.electric} /> เลขมิเตอร์ไฟ (เก่า → ใหม่)</span>
        <span style={mono}>{cycle.prev_electric} → {cycle.curr_electric ?? "-"}</span>
      </div>
    </div>
  );
}
function UsageBar({ icon: Icon, color, value, max, unit }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 mb-1 last:mb-0">
      <Icon size={12} color={color} />
      <span className="text-[10px] w-6" style={{ color: C.inkSoft }}>{unit}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E4E1D4" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] w-10 text-right" style={mono}>{value}</span>
    </div>
  );
}
function ReceiptModal({ cycle, room, property, onClose }) {
  const b = calcCycleBill(cycle);
  const paidDate = cycle.paid_at
    ? new Date(cycle.paid_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
    : "-";
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center print:static print:inset-auto" style={{ background: "rgba(22,38,59,0.5)" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div id="receipt-print" className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "#fff" }}>
        <div className="no-print flex items-center justify-end mb-2">
          <button onClick={onClose}><X size={18} color={C.inkSoft} /></button>
        </div>

        <div className="text-center mb-5">
          {property?.logo_url && (
            <img src={property.logo_url} alt="logo" className="w-10 h-10 rounded-lg object-cover mx-auto mb-2" />
          )}
          <div className="font-bold text-lg" style={{ color: C.navy, ...display }}>{property?.name || "ใบเสร็จรับเงิน"}</div>
          <div className="text-xs" style={{ color: C.inkSoft }}>ใบเสร็จรับเงิน</div>
        </div>

        <div className="space-y-1.5 text-sm mb-4" style={{ color: C.inkSoft }}>
          <div className="flex justify-between"><span>ห้อง</span><span style={{ color: C.ink }}>{room?.label}</span></div>
          <div className="flex justify-between"><span>รอบบิล</span><span style={{ color: C.ink }}>{cycle.cycle_label}</span></div>
          <div className="flex justify-between"><span>วันที่ชำระ</span><span style={{ color: C.ink }}>{paidDate}</span></div>
        </div>

        <MeterCompare cycle={cycle} />

        <div className="rounded-xl p-4 space-y-2 text-sm mb-4" style={{ background: C.paper }}>
          <Row label="ค่าเช่า" value={`฿${baht(cycle.rent)}`} />
          <Row label={`ค่าน้ำ (${b.waterUnits} หน่วย)`} value={`฿${baht(b.waterCost)}`} />
          <Row label={`ค่าไฟ (${b.electricUnits} หน่วย)`} value={`฿${baht(b.electricCost)}`} />
          <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: `1px dashed ${C.line}` }}>
            <span className="font-semibold" style={{ color: C.navy }}>ยอดรวมที่ชำระ</span>
            <span className="text-xl font-bold" style={mono}>฿{baht(b.total)}</span>
          </div>
        </div>

        <button onClick={() => window.print()} className="no-print w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: C.navy }}>
          พิมพ์ / บันทึกเป็น PDF
        </button>
      </div>
    </div>
  );
}

function HistoryPanel({ history, room, property }) {
  const [selected, setSelected] = useState(null);
  const maxUsage = Math.max(1, ...history.flatMap((h) => [
    Math.max(0, h.curr_water - h.prev_water), Math.max(0, h.curr_electric - h.prev_electric),
  ]), 1);
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3"><History size={15} color={C.inkSoft} />
        <span className="text-xs font-semibold" style={{ color: C.inkSoft }}>ประวัติย้อนหลัง</span></div>
      {history.length === 0 ? (
        <p className="text-xs" style={{ color: C.inkSoft }}>ยังไม่มีข้อมูลย้อนหลัง</p>
      ) : (
        <div className="space-y-3">
          {history.map((h) => {
            const b = calcCycleBill(h);
            return (
              <button key={h.id} onClick={() => setSelected(h)} className="w-full text-left rounded-xl p-3" style={{ background: C.paper }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: C.navy }}>{h.cycle_label}</span>
                  <span className="text-sm font-bold" style={mono}>฿{baht(b.total)}</span>
                </div>
                <UsageBar icon={Droplet} color={C.water} value={b.waterUnits} max={maxUsage} unit="น้ำ" />
                <UsageBar icon={Zap} color={C.electric} value={b.electricUnits} max={maxUsage} unit="ไฟ" />
                <div className="text-[10px] mt-1.5" style={{ color: C.inkSoft }}>แตะเพื่อดูใบเสร็จ</div>
              </button>
            );
          })}
        </div>
      )}
      {selected && (
        <ReceiptModal cycle={selected} room={room} property={property} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
function QRMock({ seed }) {
  const cells = React.useMemo(() => {
    let s = 0;
    for (let i = 0; i < String(seed).length; i++) s += String(seed).charCodeAt(i);
    const arr = [];
    for (let i = 0; i < 121; i++) { s = (s * 9301 + 49297) % 233280; arr.push(s / 233280 > 0.52); }
    return arr;
  }, [seed]);
  return (
    <div className="grid gap-[2px] p-3 rounded-xl" style={{ gridTemplateColumns: "repeat(11, 1fr)", background: "#fff", border: `1px solid ${C.line}`, width: 176 }}>
      {cells.map((on, i) => (<div key={i} style={{ aspectRatio: "1/1", background: on ? C.navy : "transparent" }} />))}
    </div>
  );
}
function Spinner({ label }) {
  return (<div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: C.inkSoft }}>
    <Loader2 size={22} className="animate-spin" /><span className="text-xs">{label}</span></div>);
}

// ---------- login ----------
function LoginScreen({ property }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: idToEmail(userId), password });
    setBusy(false);
    if (error) setError("รหัส ID หรือรหัสผ่านไม่ถูกต้อง");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-5" style={{ background: C.navy }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6 text-white">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
            {property?.logo_url ? <img src={property.logo_url} alt="logo" className="w-full h-full object-cover" /> : <Home size={22} />}
          </div>
          <h1 className="text-xl font-bold" style={display}>บ้านเช่า</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{property?.name || "กำลังโหลด..."}</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl p-5" style={{ background: C.card }}>
          <label className="text-xs font-medium" style={{ color: C.inkSoft }}>รหัสผู้ใช้ (ID)</label>
          <div className="flex items-center gap-2 mt-1 mb-3 px-3 py-2 rounded-xl" style={{ border: `1px solid ${C.line}` }}>
            <Mail size={15} color={C.inkSoft} />
            <input value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full text-sm outline-none" style={mono} placeholder="เช่น landlord หรือ 1a" />
          </div>
          <label className="text-xs font-medium" style={{ color: C.inkSoft }}>รหัสผ่าน</label>
          <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl" style={{ border: `1px solid ${C.line}` }}>
            <Lock size={15} color={C.inkSoft} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-sm outline-none" style={mono} placeholder="••••••••" />
          </div>
          {error && <p className="text-xs mt-2" style={{ color: C.alert }}>{error}</p>}
          <button type="submit" disabled={busy} className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
            {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>
        <p className="text-[11px] mt-4 text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
          บัญชีถูกสร้างโดยเจ้าของบ้านผ่าน Supabase Dashboard
        </p>
      </div>
    </div>
  );
}

// ---------- landlord ----------
function LandlordView({ rooms, cyclesByRoom, rates, property, onRefresh }) {
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [rentDraft, setRentDraft] = useState("");
  const [photoDraft, setPhotoDraft] = useState("");
  const [rateDraft, setRateDraft] = useState({ water: rates?.water_rate || 18, electric: rates?.electric_rate || 8 });
  const [propDraft, setPropDraft] = useState({ name: property?.name || "", logo_url: property?.logo_url || "", payment_qr_url: property?.payment_qr_url || "" });
  const [addForm, setAddForm] = useState({ label: "", tenantId: "", rent: "", prevWater: "0", prevElectric: "0" });
  const [addError, setAddError] = useState("");
  const [busy, setBusy] = useState(false);

  const room = rooms.find((r) => r.id === selectedId);
  const cycle = room ? cyclesByRoom[room.id] : null;
  const bill = calcCycleBill(cycle);

  const openRoom = async (r) => {
    setSelectedId(r.id);
    setRentDraft(r.rent);
    setPhotoDraft(r.photo || "");
    const { data } = await supabase.from("billing_cycles").select("*").eq("room_id", r.id).eq("status", "paid").order("created_at", { ascending: false });
    setHistory(data || []);
  };

  const saveRent = async () => {
    setBusy(true);
    await supabase.from("rooms").update({ rent: Number(rentDraft) }).eq("id", room.id);
    if (cycle && cycle.status === "awaiting_reading") {
      await supabase.from("billing_cycles").update({ rent: Number(rentDraft) }).eq("id", cycle.id);
    }
    setBusy(false); onRefresh();
  };
  const savePhoto = async () => {
    setBusy(true);
    await supabase.from("rooms").update({ photo: photoDraft }).eq("id", room.id);
    setBusy(false); onRefresh();
  };
  const saveRates = async () => {
    setBusy(true);
    await supabase.from("rates").update({ water_rate: Number(rateDraft.water), electric_rate: Number(rateDraft.electric) }).eq("id", 1);
    await supabase.from("property_settings").update({ name: propDraft.name, logo_url: propDraft.logo_url, payment_qr_url: propDraft.payment_qr_url }).eq("id", 1);
    setBusy(false); setShowSettings(false); onRefresh();
  };
  const markCashPaid = async () => {
    setBusy(true);
    await closeCycleAndAdvance(cycle, room, rates, "cash");
    setBusy(false); setSelectedId(null); onRefresh();
  };
  const confirmTransfer = async () => {
    setBusy(true);
    await closeCycleAndAdvance(cycle, room, rates, "promptpay");
    setBusy(false); setSelectedId(null); onRefresh();
  };
  const createRoom = async () => {
    const rent = Number(addForm.rent);
    if (!addForm.label.trim() || !addForm.tenantId.trim() || !rent) { setAddError("กรอกข้อมูลให้ครบทุกช่อง"); return; }
    setBusy(true);
    const { data: newRoom, error } = await supabase.from("rooms").insert({
      label: addForm.label.trim(), tenant_id: addForm.tenantId.trim(), rent,
      prev_water: Number(addForm.prevWater) || 0, prev_electric: Number(addForm.prevElectric) || 0,
    }).select().single();
    if (error) { setAddError("สร้างห้องไม่สำเร็จ ตรวจสอบว่า Tenant User ID ถูกต้อง: " + error.message); setBusy(false); return; }
    await supabase.from("billing_cycles").insert({
      room_id: newRoom.id, cycle_label: currentCycleLabel(),
      prev_water: newRoom.prev_water, prev_electric: newRoom.prev_electric,
      rent, water_rate: rates.water_rate, electric_rate: rates.electric_rate, status: "awaiting_reading",
    });
    setBusy(false); setShowAddRoom(false); setAddForm({ label: "", tenantId: "", rent: "", prevWater: "0", prevElectric: "0" }); setAddError("");
    onRefresh();
  };

  return (
    <div className="p-5 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.navy, ...display }}>{property?.name}</h1>
          <p className="text-sm" style={{ color: C.inkSoft }}>ภาพรวมห้องเช่าทั้งหมด {rooms.length} ห้อง</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddRoom(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white" style={{ background: C.navy }}>
            <Plus size={16} /> เพิ่มห้อง
          </button>
          <button onClick={() => { setPropDraft({ name: property?.name || "", logo_url: property?.logo_url || "", payment_qr_url: property?.payment_qr_url || "" }); setRateDraft({ water: rates?.water_rate, electric: rates?.electric_rate }); setShowSettings(true); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.navy }}>
            <Settings size={16} /> ตั้งค่า
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => {
          const c = cyclesByRoom[r.id];
          const b = calcCycleBill(c);
          return (
            <button key={r.id} onClick={() => openRoom(r)} className="text-left rounded-2xl overflow-hidden flex flex-col gap-3 transition hover:-translate-y-0.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              {r.photo ? <img src={r.photo} alt={r.label} className="w-full h-28 object-cover" /> : (
                <div className="w-full h-28 flex items-center justify-center" style={{ background: C.paper }}><Home size={22} color={C.line} /></div>
              )}
              <div className="px-4 flex items-center justify-between">
                <span className="font-bold" style={{ color: C.navy, ...display }}>{r.label}</span>
                {c && <Badge status={c.status} />}
              </div>
              <div className="px-4 flex items-center gap-4 text-xs" style={{ color: C.inkSoft }}>
                <span className="flex items-center gap-1"><Droplet size={13} color={C.water} />{b ? b.waterUnits : "—"} หน่วย</span>
                <span className="flex items-center gap-1"><Zap size={13} color={C.electric} />{b ? b.electricUnits : "—"} หน่วย</span>
              </div>
              <div className="px-4 pb-4 flex items-center justify-between pt-2" style={{ borderTop: `1px dashed ${C.line}` }}>
                <span className="text-xs" style={{ color: C.inkSoft }}>ยอดรวมรอบนี้</span>
                <span className="text-lg font-bold" style={mono}>{b ? `฿${baht(b.total)}` : "—"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {showAddRoom && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center" style={{ background: "rgba(22,38,59,0.45)" }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: C.card }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: C.navy, ...display }}>เพิ่มห้องใหม่</h3>
              <button onClick={() => setShowAddRoom(false)}><X size={18} color={C.inkSoft} /></button>
            </div>
            <div className="rounded-xl p-3 mb-3 text-xs" style={{ background: C.electricSoft, color: C.electric }}>
              ก่อนเพิ่มห้อง ต้องสร้างบัญชีผู้เช่าใน Supabase Dashboard (Authentication → Add user) ก่อน แล้วคัดลอก User ID (uuid) มาใส่ด้านล่าง
            </div>
            <div className="space-y-3">
              <div><label className="text-xs font-medium" style={{ color: C.inkSoft }}>ชื่อห้อง</label>
                <input placeholder="เช่น ห้อง 2B" value={addForm.label} onChange={(e) => setAddForm({ ...addForm, label: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}` }} /></div>
              <div><label className="text-xs font-medium" style={{ color: C.inkSoft }}>Tenant User ID (uuid จาก Supabase)</label>
                <input placeholder="เช่น 9c3b1a2e-..." value={addForm.tenantId} onChange={(e) => setAddForm({ ...addForm, tenantId: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} /></div>
              <div><label className="text-xs font-medium" style={{ color: C.inkSoft }}>ค่าเช่า (บาท/เดือน)</label>
                <input type="number" value={addForm.rent} onChange={(e) => setAddForm({ ...addForm, rent: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium" style={{ color: C.inkSoft }}>เลขมิเตอร์น้ำเริ่มต้น</label>
                  <input type="number" value={addForm.prevWater} onChange={(e) => setAddForm({ ...addForm, prevWater: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} /></div>
                <div><label className="text-xs font-medium" style={{ color: C.inkSoft }}>เลขมิเตอร์ไฟเริ่มต้น</label>
                  <input type="number" value={addForm.prevElectric} onChange={(e) => setAddForm({ ...addForm, prevElectric: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} /></div>
              </div>
              {addError && <p className="text-xs" style={{ color: C.alert }}>{addError}</p>}
              <button onClick={createRoom} disabled={busy} className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
                {busy ? "กำลังสร้าง…" : "สร้างห้อง"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center" style={{ background: "rgba(22,38,59,0.45)" }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5" style={{ background: C.card }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: C.navy, ...display }}>ตั้งค่าอพาร์ตเมนต์</h3>
              <button onClick={() => setShowSettings(false)}><X size={18} color={C.inkSoft} /></button>
            </div>
            <label className="text-xs font-medium" style={{ color: C.inkSoft }}>ชื่ออพาร์ตเมนต์</label>
            <input value={propDraft.name} onChange={(e) => setPropDraft({ ...propDraft, name: e.target.value })} className="w-full mt-1 mb-3 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}` }} />
            <label className="text-xs font-medium" style={{ color: C.inkSoft }}>โลโก้ (ลิงก์รูปภาพ)</label>
            <input value={propDraft.logo_url} onChange={(e) => setPropDraft({ ...propDraft, logo_url: e.target.value })} placeholder="https://..." className="w-full mt-1 mb-3 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}` }} />
            <label className="text-xs font-medium" style={{ color: C.inkSoft }}>QR พร้อมเพย์จริง (ลิงก์รูปภาพ)</label>
            <div className="flex items-center gap-2 mt-1 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
                {propDraft.payment_qr_url ? <img src={propDraft.payment_qr_url} alt="QR" className="w-full h-full object-cover" /> : <QrCode size={16} color={C.inkSoft} />}
              </div>
              <input value={propDraft.payment_qr_url} onChange={(e) => setPropDraft({ ...propDraft, payment_qr_url: e.target.value })} placeholder="https://..." className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}` }} />
            </div>
            <p className="text-[11px] -mt-2 mb-3" style={{ color: C.inkSoft }}>
              อัปโหลดรูป QR พร้อมเพย์จริงของคุณ (จากแอปธนาคาร) ไว้ที่อื่นก่อน เช่น Imgur แล้ววางลิงก์รูปตรงนี้ ผู้เช่าจะสแกนแล้วโอนเงินเข้าบัญชีคุณโดยตรง
            </p>
            <div className="h-px my-3" style={{ background: C.line }} />
            <p className="text-xs font-semibold mb-2" style={{ color: C.inkSoft }}>อัตราค่าน้ำไฟ (ทุกห้อง)</p>
            <label className="text-xs font-medium" style={{ color: C.inkSoft }}>ค่าน้ำ (บาท/หน่วย)</label>
            <input type="number" value={rateDraft.water} onChange={(e) => setRateDraft({ ...rateDraft, water: e.target.value })} className="w-full mt-1 mb-3 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} />
            <label className="text-xs font-medium" style={{ color: C.inkSoft }}>ค่าไฟ (บาท/หน่วย)</label>
            <input type="number" value={rateDraft.electric} onChange={(e) => setRateDraft({ ...rateDraft, electric: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} />
            <button onClick={saveRates} disabled={busy} className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>บันทึก</button>
          </div>
        </div>
      )}

      {room && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center" style={{ background: "rgba(22,38,59,0.45)" }}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: C.card }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: C.navy, ...display }}>{room.label}</h3>
              <button onClick={() => setSelectedId(null)}><X size={18} color={C.inkSoft} /></button>
            </div>

            <div className="rounded-xl p-3 mb-3" style={{ background: C.paper }}>
              <label className="text-xs font-medium" style={{ color: C.inkSoft }}>รูปภาพห้อง (ลิงก์รูปภาพ)</label>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                  {photoDraft ? <img src={photoDraft} alt={room.label} className="w-full h-full object-cover" /> : <ImageIcon size={16} color={C.inkSoft} />}
                </div>
                <input value={photoDraft} onChange={(e) => setPhotoDraft(e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, background: "#fff" }} />
                <button onClick={savePhoto} disabled={busy} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: C.navy }}>บันทึก</button>
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4" style={{ background: C.paper }}>
              <label className="text-xs font-medium" style={{ color: C.inkSoft }}>ค่าเช่าห้องนี้ (บาท/เดือน)</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="number" value={rentDraft} onChange={(e) => setRentDraft(e.target.value)} className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, background: "#fff", ...mono }} />
                <button onClick={saveRent} disabled={busy} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: C.navy }}>บันทึก</button>
              </div>
            </div>

            {!cycle || cycle.status === "awaiting_reading" ? (
              <div className="rounded-xl p-4 text-sm" style={{ background: C.alertSoft, color: C.alert }}>ผู้เช่ายังไม่ได้กรอกมิเตอร์น้ำไฟของรอบนี้</div>
            ) : (
              <div className="space-y-2 text-sm">
                <MeterCompare cycle={cycle} />
                <Row label="ค่าเช่า" value={`฿${baht(cycle.rent)}`} />
                <Row label={`ค่าน้ำ (${bill.waterUnits} หน่วย)`} value={`฿${baht(bill.waterCost)}`} />
                <Row label={`ค่าไฟ (${bill.electricUnits} หน่วย)`} value={`฿${baht(bill.electricCost)}`} />
                <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: `1px solid ${C.line}` }}>
                  <span className="font-semibold" style={{ color: C.navy }}>ยอดรวม</span>
                  <span className="text-xl font-bold" style={mono}>฿{baht(bill.total)}</span>
                </div>
              </div>
            )}
            {cycle && cycle.status === "awaiting_payment" && (
              <button onClick={markCashPaid} disabled={busy} className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: C.success }}>
                <Wallet size={16} /> {busy ? "กำลังบันทึก…" : "บันทึกว่าได้รับเงินสดแล้ว"}
              </button>
            )}
            {cycle && cycle.status === "awaiting_confirmation" && (
              <div className="mt-5">
                <div className="rounded-xl p-3 mb-3 text-xs flex items-center gap-2" style={{ background: C.alertSoft, color: C.alert }}>
                  <QrCode size={14} /> ผู้เช่าแจ้งว่าโอนเงินแล้ว — เช็คแอปธนาคารของคุณก่อนกดยืนยัน
                </div>
                <button onClick={confirmTransfer} disabled={busy} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: C.success }}>
                  <Wallet size={16} /> {busy ? "กำลังบันทึก…" : "ยืนยันได้รับเงินแล้ว"}
                </button>
              </div>
            )}
            <HistoryPanel history={history} room={room} property={property} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- tenant ----------
function TenantView({ room, cycle, rates, property, onRefresh }) {
  const [water, setWater] = useState(cycle ? cycle.prev_water : 0);
  const [electric, setElectric] = useState(cycle ? cycle.prev_electric : 0);
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!room) return;
    supabase.from("billing_cycles").select("*").eq("room_id", room.id).eq("status", "paid").order("created_at", { ascending: false })
      .then(({ data }) => setHistory(data || []));
  }, [room, cycle?.status]);

  if (!room || !cycle) return <Spinner label="กำลังโหลดข้อมูลห้อง…" />;
  const bill = calcCycleBill(cycle);

  const submitReading = async () => {
    setProcessing(true);
    await supabase.from("billing_cycles").update({ curr_water: Number(water), curr_electric: Number(electric), status: "awaiting_payment", submitted_at: new Date().toISOString() }).eq("id", cycle.id);
    setProcessing(false); onRefresh();
  };

  const notifyTransferred = async () => {
    setProcessing(true);
    await supabase.from("billing_cycles").update({ status: "awaiting_confirmation" }).eq("id", cycle.id);
    setProcessing(false); onRefresh();
  };

  return (
    <div className="p-5 md:p-8 max-w-lg mx-auto">
      {cycle.status === "awaiting_reading" && (
        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <h2 className="font-bold mb-1" style={{ color: C.navy, ...display }}>กรอกมิเตอร์รอบนี้ — {cycle.cycle_label}</h2>
          <p className="text-xs mb-4" style={{ color: C.inkSoft }}>เลขมิเตอร์ครั้งก่อน — น้ำ {cycle.prev_water} · ไฟ {cycle.prev_electric}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Gauge value={Math.max(0, water - cycle.prev_water)} max={20} color={C.water} softColor={C.waterSoft} icon={Droplet} label="น้ำ (หน่วยที่ใช้)" unitLabel="หน่วย" />
            <Gauge value={Math.max(0, electric - cycle.prev_electric)} max={150} color={C.electric} softColor={C.electricSoft} icon={Zap} label="ไฟ (หน่วยที่ใช้)" unitLabel="หน่วย" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs" style={{ color: C.inkSoft }}>เลขมิเตอร์น้ำปัจจุบัน</label>
              <input type="number" value={water} onChange={(e) => setWater(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} /></div>
            <div><label className="text-xs" style={{ color: C.inkSoft }}>เลขมิเตอร์ไฟปัจจุบัน</label>
              <input type="number" value={electric} onChange={(e) => setElectric(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} /></div>
          </div>
          <button onClick={submitReading} disabled={processing} className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
            {processing ? "กำลังส่ง…" : "ส่งค่ามิเตอร์"}
          </button>
          <HistoryPanel history={history} room={room} property={property} />
        </div>
      )}

      {cycle.status === "awaiting_payment" && (
        <>
          <div className="rounded-2xl p-5 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <h2 className="font-bold mb-3" style={{ color: C.navy, ...display }}>บิลรอบนี้ — {room.label} ({cycle.cycle_label})</h2>
            <MeterCompare cycle={cycle} />
            <div className="space-y-2 text-sm">
              <Row label="ค่าเช่า" value={`฿${baht(cycle.rent)}`} />
              <Row label={`ค่าน้ำ (${bill.waterUnits} หน่วย)`} value={`฿${baht(bill.waterCost)}`} />
              <Row label={`ค่าไฟ (${bill.electricUnits} หน่วย)`} value={`฿${baht(bill.electricCost)}`} />
            </div>
            <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: `1px solid ${C.line}` }}>
              <span className="font-semibold" style={{ color: C.navy }}>ยอดที่ต้องชำระ</span>
              <span className="text-2xl font-bold" style={mono}>฿{baht(bill.total)}</span>
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: C.navy, ...display }}><QrCode size={16} /> สแกนพร้อมเพย์เพื่อโอนเงิน</h3>
            <div className="flex flex-col items-center">
              {property?.payment_qr_url ? (
                <img src={property.payment_qr_url} alt="พร้อมเพย์" className="w-44 h-44 object-contain rounded-xl" style={{ border: `1px solid ${C.line}` }} />
              ) : (
                <>
                  <QRMock seed={room.id + bill.total} />
                  <p className="text-[11px] mt-2 text-center" style={{ color: C.alert }}>เจ้าของบ้านยังไม่ได้อัปโหลด QR พร้อมเพย์จริง — นี่เป็นแค่ตัวอย่าง</p>
                </>
              )}
              <p className="text-sm mt-3 font-medium" style={{ color: C.navy }}>ยอดโอน ฿{baht(bill.total)}</p>
              <p className="text-[11px] mt-1 text-center" style={{ color: C.inkSoft }}>
                สแกนแล้วโอนผ่านแอปธนาคารของคุณ จากนั้นกดปุ่มด้านล่างเพื่อแจ้งเจ้าของบ้าน
              </p>
            </div>
            <button onClick={notifyTransferred} disabled={processing} className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: processing ? C.navySoft : C.navy }}>
              {processing ? "กำลังส่ง…" : "แจ้งว่าโอนเงินแล้ว"}
            </button>
          </div>
          <div className="rounded-2xl p-5 mt-4" style={{ background: C.card, border: `1px solid ${C.line}` }}><HistoryPanel history={history} room={room} property={property} /></div>
        </>
      )}

      {cycle.status === "awaiting_confirmation" && (
        <>
          <div className="rounded-2xl p-6 flex flex-col items-center text-center" style={{ background: C.alertSoft, border: `1px solid ${C.line}` }}>
            <QrCode size={32} color={C.alert} />
            <h2 className="font-bold mt-3" style={{ color: C.navy, ...display }}>แจ้งโอนเงินแล้ว</h2>
            <p className="text-sm mt-1" style={{ color: C.inkSoft }}>รอเจ้าของบ้านตรวจสอบและยืนยันยอด ฿{baht(bill.total)}</p>
          </div>
          <div className="rounded-2xl p-5 mt-4" style={{ background: C.card, border: `1px solid ${C.line}` }}><HistoryPanel history={history} room={room} property={property} /></div>
        </>
      )}
    </div>
  );
}

// ---------- shared: close a cycle, record payment, open the next one ----------
async function closeCycleAndAdvance(cycle, room, rates, method) {
  const bill = calcCycleBill(cycle);
  await supabase.from("billing_cycles").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", cycle.id);
  await supabase.from("payments").insert({ billing_cycle_id: cycle.id, method, amount: bill.total, status: "succeeded" });
  await supabase.from("billing_cycles").insert({
    room_id: room.id, cycle_label: currentCycleLabel(),
    prev_water: cycle.curr_water, prev_electric: cycle.curr_electric,
    rent: room.rent, water_rate: rates.water_rate, electric_rate: rates.electric_rate, status: "awaiting_reading",
  });
}

// ---------- app root ----------
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(null);
  const [property, setProperty] = useState(null);
  const [rates, setRates] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [cyclesByRoom, setCyclesByRoom] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadData = useCallback(async (userId) => {
    setLoadingData(true);
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(prof);
    const { data: prop } = await supabase.from("property_settings").select("*").eq("id", 1).single();
    setProperty(prop);
    const { data: rateRow } = await supabase.from("rates").select("*").eq("id", 1).single();
    setRates(rateRow);

    if (prof?.role === "landlord") {
      const { data: allRooms } = await supabase.from("rooms").select("*").order("label");
      setRooms(allRooms || []);
      const { data: openCycles } = await supabase.from("billing_cycles").select("*").neq("status", "paid");
      const map = {};
      (openCycles || []).forEach((c) => { map[c.room_id] = c; });
      setCyclesByRoom(map);
    } else {
      const { data: myRoom } = await supabase.from("rooms").select("*").eq("tenant_id", userId).single();
      setRooms(myRoom ? [myRoom] : []);
      if (myRoom) {
        const { data: openCycle } = await supabase.from("billing_cycles").select("*").eq("room_id", myRoom.id).neq("status", "paid").order("created_at", { ascending: false }).limit(1).maybeSingle();
        setCyclesByRoom(openCycle ? { [myRoom.id]: openCycle } : {});
      }
    }
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) { setProfile(null); setLoadingData(false); return; }
    loadData(session.user.id);
  }, [session, loadData]);

  if (session === undefined) return <Spinner label="กำลังโหลด…" />;
  if (session === null) return <LoginScreen property={property} />;
  if (loadingData || !profile) return <Spinner label="กำลังโหลดข้อมูล…" />;

  const myRoom = rooms[0];
  const myCycle = myRoom ? cyclesByRoom[myRoom.id] : null;

  return (
    <div className="min-h-screen w-full" style={{ background: C.paper, fontFamily: "'Inter', sans-serif" }}>
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 md:px-8 py-3" style={{ background: C.navy }}>
        <div className="flex items-center gap-2 text-white">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.14)" }}>
            {property?.logo_url ? <img src={property.logo_url} alt="logo" className="w-full h-full object-cover" /> : <Home size={16} />}
          </div>
          <span className="font-semibold text-sm" style={display}>{property?.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white hidden sm:inline" style={{ opacity: 0.8 }}>{profile.full_name}</span>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full text-white" style={{ background: "rgba(255,255,255,0.14)" }}>
            <LogOut size={13} /> ออกจากระบบ
          </button>
        </div>
      </div>

      {profile.role === "landlord" ? (
        <LandlordView rooms={rooms} cyclesByRoom={cyclesByRoom} rates={rates} property={property} onRefresh={() => loadData(session.user.id)} />
      ) : (
        <TenantView room={myRoom} cycle={myCycle} rates={rates} property={property} onRefresh={() => loadData(session.user.id)} />
      )}
    </div>
  );
}
