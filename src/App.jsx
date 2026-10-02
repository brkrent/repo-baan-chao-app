import React, { useEffect, useState, useCallback } from "react";
import {
  Home, Droplet, Zap, Settings, X, CheckCircle2, QrCode,
  Wallet, LogOut, History, Lock, Mail, Image as ImageIcon, Pencil, Plus, Loader2, Camera, ShoppingCart, Minus, Trash2, User, CreditCard, Phone, FileText,
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

// ---------- ธีมตามเทศกาล/วันสำคัญ — เจ้าของบ้านเปลี่ยนได้จากหน้าตั้งค่าในแอป ไม่ต้องแก้โค้ด/อัปโหลดใหม่ ----------
// เลือก "อัตโนมัติ" ได้ด้วย — ระบบจะขึ้นธีมให้เอง 7 วันก่อนถึงวันงานจนถึง 7 วันหลังวันงาน
// ถ้ามีวันสำคัญอื่นเหลื่อมกัน จะเลือกวันที่ใกล้ "วันจริง" ที่สุดให้ขึ้นก่อน
const THEMES = {
  default: { label: "ปกติ", category: "เริ่มต้น", headerBg: C.navy, accent: C.navy, emoji: "" },

  songkran: { label: "สงกรานต์", category: "เทศกาลรื่นเริง", headerBg: "#1E6FA8", accent: "#1E6FA8", emoji: "💦",
    fact: "สงกรานต์คือวันขึ้นปีใหม่ไทยแบบดั้งเดิม เดิมเน้นการสรงน้ำพระและรดน้ำขอพรผู้ใหญ่ ก่อนจะกลายเป็นเทศกาลสาดน้ำที่รู้จักกันทั่วโลก",
    particle: ["droplet", "splash"], scene: [{ e: "🐘", left: 0, top: 30, size: 56, anim: "patrol" }, { e: "🌺", left: 86, top: 62, size: 26, anim: "sway", delay: .3 }] },
  loykrathong: { label: "ลอยกระทง", category: "เทศกาลรื่นเริง", headerBg: "#3A2E5C", accent: "#C9972F", emoji: "🏮",
    fact: "ลอยกระทงจัดขึ้นคืนวันเพ็ญเดือน 12 เพื่อขอขมาและแสดงความกตัญญูต่อพระแม่คงคา เชื่อกันว่าเป็นการลอยทิ้งสิ่งไม่ดีไปกับสายน้ำ",
    particle: ["lantern", "glow"], scene: [{ e: "🛶", left: 0, top: 45, size: 46, anim: "patrolsmall" }, { e: "🏮", left: 88, top: 15, size: 28, anim: "sway", delay: .4 }] },
  newyear: { label: "ปีใหม่", category: "เทศกาลรื่นเริง", headerBg: "#7A1F2B", accent: "#B5892B", emoji: "🎉",
    fact: "ไทยเริ่มใช้วันที่ 1 มกราคม เป็นวันขึ้นปีใหม่สากลอย่างเป็นทางการตั้งแต่ปี พ.ศ. 2484 แทนวันขึ้นปีใหม่เดิมคือ 1 เมษายน",
    particle: ["confetti", "spark"], scene: [{ e: "🎆", left: 6, top: 15, size: 34, anim: "still" }, { e: "🎇", left: 88, top: 20, size: 30, anim: "still", delay: .4 }] },
  christmas: { label: "คริสต์มาส", category: "เทศกาลรื่นเริง", headerBg: "#1E5C3A", accent: "#B5292F", emoji: "🎄",
    fact: "วันคริสต์มาสระลึกถึงการประสูติของพระเยซู เป็นเทศกาลสำคัญของชาวคริสต์ทั่วโลก ส่วนในไทยนิยมฉลองกันทั่วไปแบบไม่เน้นศาสนา",
    particle: ["snow", "glow"], scene: [{ e: "🛷", left: 0, top: 12, size: 48, anim: "patrol" }, { e: "🎄", left: 88, top: 50, size: 40, anim: "sway", delay: .2 }] },
  halloween: { label: "ฮาโลวีน", category: "เทศกาลรื่นเริง", headerBg: "#2B2130", accent: "#D97A2A", emoji: "🎃",
    fact: "ฮาโลวีนมีต้นกำเนิดจากเทศกาลเคลติกโบราณ เชื่อว่าเป็นคืนที่เส้นแบ่งระหว่างโลกมนุษย์กับโลกวิญญาณบางที่สุดในรอบปี",
    particle: ["bat", "glow"], scene: [{ e: "🧙", left: 0, top: 25, size: 50, anim: "patrol" }, { e: "🎃", left: 88, top: 58, size: 30, anim: "still", delay: .3 }] },
  chinesenewyear: { label: "ตรุษจีน", category: "เทศกาลรื่นเริง", headerBg: "#7A1620", accent: "#C9972F", emoji: "🧧",
    fact: "ตรุษจีนคือวันขึ้นปีใหม่ตามปฏิทินจันทรคติจีน ครอบครัวจะไหว้บรรพบุรุษและแจกอั่งเปาสีแดง-ทอง เพื่อความเป็นสิริมงคล",
    particle: ["redgold", "glow"], scene: [{ e: "🐉", left: 0, top: 25, size: 64, anim: "patrol" }, { e: "🏮", left: 86, top: 14, size: 28, anim: "sway", delay: .3 }] },
  midautumn: { label: "ไหว้พระจันทร์", category: "เทศกาลรื่นเริง", headerBg: "#14204A", accent: "#C9A227", emoji: "🎑",
    fact: "เทศกาลไหว้พระจันทร์จัดคืนวันเพ็ญเดือน 8 ตามจันทรคติจีน เพื่อขอบคุณพระจันทร์และความอุดมสมบูรณ์ สัญลักษณ์คือขนมไหว้พระจันทร์และกระต่าย",
    particle: ["lantern", "glow"], scene: [{ e: "🐇", left: 0, top: 50, size: 40, anim: "patrolsmall" }, { e: "🎑", left: 88, top: 16, size: 36, anim: "still", delay: .2 }] },
  vegetarian: { label: "กินเจ", category: "เทศกาลรื่นเริง", headerBg: "#8A6A1E", accent: "#C9A227", emoji: "🟡",
    fact: "เทศกาลกินเจกินเวลา 9 วัน ผู้ร่วมงานละเว้นเนื้อสัตว์เพื่อชำระกายใจให้บริสุทธิ์ นิยมมากในภาคใต้ โดยเฉพาะที่จังหวัดภูเก็ต",
    particle: ["petal", "glow"], scene: [{ e: "🚩", left: 6, top: 16, size: 28, anim: "sway" }, { e: "🥬", left: 88, top: 55, size: 26, anim: "bob", delay: .3 }] },
  sartthai: { label: "วันสารทไทย", category: "เทศกาลรื่นเริง", headerBg: "#5C4A1E", accent: "#C9972F", emoji: "🌾",
    fact: "วันสารทไทยตรงกับวันแรม 15 ค่ำ เดือน 10 เป็นวันทำบุญอุทิศส่วนกุศลให้บรรพบุรุษ ขนมประจำเทศกาลคือกระยาสารทที่ทำจากข้าวตากคลุกน้ำตาลและถั่ว",
    particle: ["petal", "glow"], scene: [{ e: "🌾", left: 6, top: 60, size: 30, anim: "sway" }, { e: "🍯", left: 88, top: 20, size: 26, anim: "bob", delay: .3 }] },

  makhabucha: { label: "มาฆบูชา", category: "วันสำคัญทางพุทธศาสนา", headerBg: "#4A3B2A", accent: "#C9972F", emoji: "🪷",
    fact: "วันมาฆบูชาระลึกถึงวันที่พระพุทธเจ้าทรงแสดง “โอวาทปาฏิโมกข์” แก่พระอรหันต์ 1,250 องค์ ที่มาประชุมพร้อมกันโดยมิได้นัดหมาย",
    particle: ["petal", "glow"], scene: [{ e: "🪷", left: 6, top: 60, size: 28, anim: "bob" }, { e: "🕯️", left: 88, top: 20, size: 26, anim: "still", delay: .3 }] },
  visakhabucha: { label: "วิสาขบูชา", category: "วันสำคัญทางพุทธศาสนา", headerBg: "#4A3B2A", accent: "#C9972F", emoji: "🪷",
    fact: "วันวิสาขบูชาเป็นวันประสูติ ตรัสรู้ และปรินิพพานของพระพุทธเจ้า ตรงกันทั้งสามเหตุการณ์ในวันเดียว องค์การสหประชาชาติยกให้เป็นวันสำคัญของโลก",
    particle: ["petal", "glow"], scene: [{ e: "🪷", left: 6, top: 60, size: 28, anim: "bob" }, { e: "🕯️", left: 88, top: 20, size: 26, anim: "still", delay: .3 }] },
  asalhabucha: { label: "อาสาฬหบูชา", category: "วันสำคัญทางพุทธศาสนา", headerBg: "#4A3B2A", accent: "#C9972F", emoji: "🪷",
    fact: "วันอาสาฬหบูชาระลึกถึงการแสดงปฐมเทศนาครั้งแรกของพระพุทธเจ้า คือ “ธัมมจักกัปปวัตนสูตร” นับเป็นวันที่เกิดพระสงฆ์องค์แรกในพระพุทธศาสนา",
    particle: ["petal", "glow"], scene: [{ e: "🪷", left: 6, top: 60, size: 28, anim: "bob" }, { e: "🕯️", left: 88, top: 20, size: 26, anim: "still", delay: .3 }] },
  khaophansa: { label: "เข้าพรรษา", category: "วันสำคัญทางพุทธศาสนา", headerBg: "#1E2E1E", accent: "#8A6A2E", emoji: "🕯️",
    fact: "วันเข้าพรรษาคือวันที่พระสงฆ์เริ่มจำพรรษาอยู่ ณ วัดใดวัดหนึ่งตลอด 3 เดือนในฤดูฝน เป็นที่มาของประเพณีถวายเทียนพรรษาที่สืบทอดมานาน",
    particle: ["petal", "glow"], scene: [{ e: "🕯️", left: 6, top: 55, size: 34, anim: "still" }, { e: "🌧️", left: 88, top: 16, size: 26, anim: "bob", delay: .3 }] },
  okphansa: { label: "ออกพรรษา", category: "วันสำคัญทางพุทธศาสนา", headerBg: "#4A2A12", accent: "#D97A2A", emoji: "🛶",
    fact: "วันออกพรรษาคือวันสิ้นสุดการจำพรรษา 3 เดือนของพระสงฆ์ มีประเพณีตักบาตรเทโวและไหลเรือไฟที่สืบทอดมาในหลายจังหวัดริมแม่น้ำ",
    particle: ["glow"], scene: [{ e: "🛶", left: 0, top: 50, size: 42, anim: "patrolsmall" }, { e: "🔥", left: 88, top: 20, size: 24, anim: "bob", delay: .3 }] },

  chakri: { label: "วันจักรี", category: "วันสำคัญของชาติ", headerBg: "#0E2036", accent: "#C9A227", emoji: "🏛️",
    fact: "วันจักรีระลึกถึงวันที่พระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชทรงสถาปนาราชวงศ์จักรีและกรุงเทพมหานคร เมื่อปี พ.ศ. 2325",
    particle: ["glow"], scene: [{ e: "🏛️", left: 88, top: 45, size: 34, anim: "still" }] },
  chatramongkol: { label: "วันฉัตรมงคล", category: "วันสำคัญของชาติ", headerBg: "#4A1018", accent: "#C9A227", emoji: "👑",
    fact: "วันฉัตรมงคลระลึกถึงพระราชพิธีบรมราชาภิเษก ซึ่งเป็นพระราชพิธีโบราณที่สถาปนาพระมหากษัตริย์ให้สมบูรณ์ตามราชประเพณี",
    particle: ["glow"], scene: [{ e: "👑", left: 88, top: 20, size: 30, anim: "still" }] },
  childrenday: { label: "วันเด็กแห่งชาติ", category: "วันสำคัญของชาติ", headerBg: "#1E8FA8", accent: "#D9A227", emoji: "🎈",
    fact: "วันเด็กแห่งชาติจัดขึ้นเสาร์ที่สองของเดือนมกราคมทุกปี เริ่มจัดครั้งแรกเมื่อปี พ.ศ. 2498 เพื่อให้ความสำคัญกับเด็กในฐานะกำลังสำคัญของชาติในอนาคต",
    particle: ["confetti", "balloon"], scene: [{ e: "🪁", left: 0, top: 18, size: 36, anim: "patrolsmall" }, { e: "🎈", left: 88, top: 55, size: 28, anim: "bob", delay: .3 }] },
  teacherday: { label: "วันครู", category: "วันสำคัญของชาติ", headerBg: "#16263B", accent: "#C9972F", emoji: "📚",
    fact: "วันครูแห่งชาติตรงกับวันที่ 16 มกราคมของทุกปี เริ่มจัดครั้งแรกเมื่อปี พ.ศ. 2500 เพื่อระลึกถึงพระคุณของครู ประเพณีสำคัญคือพิธีไหว้ครูด้วยดอกเข็มและหญ้าแพรก",
    particle: ["petal", "glow"], scene: [{ e: "📚", left: 88, top: 50, size: 28, anim: "still" }] },
};

// รายการวันที่ของแต่ละธีม ใช้คำนวณ "ธีมอัตโนมัติ" — ขึ้นก่อนวันจริง 7 วัน ถึงหลังวันจริง 7 วัน
// kind "fixed" = วันที่ตรงทุกปี (ไม่ต้องอัปเดต) | "nthWeekday" = คำนวณจากวันในสัปดาห์ (ไม่ต้องอัปเดต)
// kind "lunar" = วันตามจันทรคติ เปลี่ยนทุกปี ต้องมาเพิ่มวันที่ของปีถัดไปใน "dates" ทุกปลายปี (ถ้าไม่เพิ่ม ปีนั้นจะข้ามธีมนี้ไปเฉยๆ ไม่ error)
const FESTIVALS = [
  { key: "newyear", kind: "fixed", month: 1, day: 1 },
  { key: "childrenday", kind: "nthWeekday", month: 1, weekday: 6, n: 2 },
  { key: "teacherday", kind: "fixed", month: 1, day: 16 },
  { key: "chinesenewyear", kind: "lunar", dates: { 2026: "2026-02-17" } },
  { key: "makhabucha", kind: "lunar", dates: { 2026: "2026-03-03" } },
  { key: "chakri", kind: "fixed", month: 4, day: 6 },
  { key: "songkran", kind: "fixed", month: 4, day: 13, length: 3 },
  { key: "chatramongkol", kind: "fixed", month: 5, day: 4 },
  { key: "visakhabucha", kind: "lunar", dates: { 2026: "2026-05-31" } },
  { key: "asalhabucha", kind: "lunar", dates: { 2026: "2026-07-28" } },
  { key: "khaophansa", kind: "lunar", dates: { 2026: "2026-07-29" } },
  { key: "midautumn", kind: "lunar", dates: { 2026: "2026-09-25" } },
  { key: "vegetarian", kind: "lunar", dates: { 2026: "2026-10-10" }, length: 9 },
  { key: "sartthai", kind: "lunar", dates: { 2026: "2026-10-19" } },
  { key: "okphansa", kind: "lunar", dates: { 2026: "2026-10-26" } },
  { key: "halloween", kind: "fixed", month: 10, day: 31 },
  { key: "loykrathong", kind: "lunar", dates: { 2026: "2026-11-25" } },
  { key: "christmas", kind: "fixed", month: 12, day: 25 },
];

function stripTime(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function daysBetween(a, b) { return Math.round((stripTime(b) - stripTime(a)) / 86400000); }
function nthWeekdayOfMonth(year, month, weekday, n) {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (true) {
    if (d.getDay() === weekday) { count++; if (count === n) return new Date(d); }
    d.setDate(d.getDate() + 1);
  }
}
function getFestivalStart(f, year) {
  if (f.kind === "fixed") return new Date(year, f.month - 1, f.day);
  if (f.kind === "nthWeekday") return nthWeekdayOfMonth(year, f.month, f.weekday, f.n);
  if (f.kind === "lunar") return f.dates[year] ? new Date(f.dates[year] + "T00:00:00") : null;
  return null;
}
// หาธีมที่ควรขึ้นวันนี้ — ขึ้นก่อนวันจริง 7 วัน ถึงหลังวันจริง 7 วัน ถ้าซ้อนกันหลายวัน เลือกวันที่ "ใกล้วันจริง" ที่สุด
function resolveAutoThemeKey(now = new Date()) {
  const today = stripTime(now);
  const year = today.getFullYear();
  let bestKey = null, bestDist = Infinity;
  FESTIVALS.forEach((f) => {
    [year - 1, year, year + 1].forEach((y) => {
      const start = getFestivalStart(f, y);
      if (!start) return;
      const length = f.length || 1;
      const end = new Date(start); end.setDate(end.getDate() + length - 1);
      const winStart = new Date(start); winStart.setDate(winStart.getDate() - 7);
      const winEnd = new Date(end); winEnd.setDate(winEnd.getDate() + 7);
      if (today >= winStart && today <= winEnd) {
        const dist = today < start ? daysBetween(today, start) : today > end ? daysBetween(end, today) : 0;
        if (dist < bestDist) { bestDist = dist; bestKey = f.key; }
      }
    });
  });
  return bestKey || "default";
}
function resolveThemeKey(property) {
  const raw = property?.theme || "default";
  return raw === "auto" ? resolveAutoThemeKey() : raw;
}
function getTheme(property) {
  return THEMES[resolveThemeKey(property)] || THEMES.default;
}

// ---------- ลูกเล่นภาพเคลื่อนไหวของธีม (มาสคอต + ประกาย) — อยู่ในกรอบแถบหัวเท่านั้น ไม่บังเนื้อหาบิล ----------
// วิธีลบลูกเล่นนี้ทั้งหมดถ้าไม่ต้องการ: ลบ <ThemeFxStyle/>, <HeaderFx .../> ทุกจุดที่เรียกใช้
// และลบฟังก์ชัน/ค่าคงที่ตั้งแต่ THEME_FX_CSS ถึง HeaderFx ออกจากไฟล์นี้ (หรือขอให้ผมลบให้ก็ได้)
const THEME_FX_CSS = `
@keyframes tfxBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes tfxSway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes tfxPatrolBig{
  0%{transform:translateX(0) translateY(0) rotate(-3deg) scaleX(1)}
  24%{transform:translateX(38vw) translateY(-10px) rotate(3deg) scaleX(1)}
  49%{transform:translateX(78vw) translateY(0) rotate(-2deg) scaleX(1)}
  50%{transform:translateX(78vw) translateY(0) rotate(-2deg) scaleX(-1)}
  74%{transform:translateX(38vw) translateY(-10px) rotate(3deg) scaleX(-1)}
  99%{transform:translateX(0) translateY(0) rotate(-3deg) scaleX(-1)}
  100%{transform:translateX(0) translateY(0) rotate(-3deg) scaleX(1)}
}
@keyframes tfxPatrolSmall{0%,100%{transform:translateX(0) rotate(-4deg)}50%{transform:translateX(16vw) rotate(4deg)}}
@keyframes tfxDrift{0%{transform:translateY(-10px) translateX(0);opacity:0}15%{opacity:.85}85%{opacity:.7}100%{transform:translateY(60px) translateX(var(--dx,0px));opacity:0}}
@keyframes tfxRise{0%{transform:translateY(0) translateX(0) scale(.9);opacity:0}12%{opacity:.9}88%{opacity:.7}100%{transform:translateY(-70px) translateX(var(--dx,0px)) scale(1.05);opacity:0}}
.tfx-header{position:relative;overflow:hidden}
.tfx-particles{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tfx-particle{position:absolute;will-change:transform;opacity:0}
.tfx-mascot{position:absolute;z-index:1;filter:drop-shadow(0 4px 6px rgba(0,0,0,.3));animation:tfxBob 4.5s ease-in-out infinite;pointer-events:none}
.tfx-mascot.sway{animation:tfxSway 4.5s ease-in-out infinite}
.tfx-mascot.still{animation:none}
.tfx-mascot.patrol{animation:tfxPatrolBig 20s ease-in-out infinite}
.tfx-mascot.patrolsmall{animation:tfxPatrolSmall 11s ease-in-out infinite}
`;
function ThemeFxStyle() {
  return <style>{THEME_FX_CSS}</style>;
}
function fxPickKind(kind) { return Array.isArray(kind) ? kind[Math.floor(Math.random() * kind.length)] : kind; }
function fxDecorate(el, kind) {
  if (kind === "droplet") el.textContent = "💧";
  else if (kind === "splash") el.textContent = "💦";
  else if (kind === "snow") { el.textContent = "❄"; el.style.color = "#fff"; }
  else if (kind === "lantern") el.textContent = "🏮";
  else if (kind === "bat") el.textContent = "🦇";
  else if (kind === "spark") el.textContent = "✨";
  else if (kind === "balloon") el.textContent = "🎈";
  else if (kind === "petal") el.textContent = "🌸";
  else if (kind === "redgold") { el.style.width = "6px"; el.style.height = "6px"; el.style.background = "#C9972F"; el.style.transform = "rotate(45deg)"; }
  else if (kind === "glow") {
    el.style.width = "8px"; el.style.height = "8px"; el.style.borderRadius = "50%";
    el.style.background = "radial-gradient(circle, rgba(255,224,150,.95), rgba(255,224,150,0))";
    el.style.boxShadow = "0 0 8px 2px rgba(255,210,120,.6)";
  } else if (kind === "confetti") {
    el.style.width = "5px"; el.style.height = "9px";
    el.style.background = ["#C9A227", "#E2574C", "#8CC084", "#5CA0D3"][Math.floor(Math.random() * 4)];
    el.style.borderRadius = "1px";
  } else return false;
  return true;
}
// แถบหัวแอป: ใส่มาสคอต + ประกายเคลื่อนไหวของธีม (อยู่ในกรอบแถบหัวเท่านั้น ไม่กระทบเนื้อหาด้านล่าง)
function HeaderFx({ theme }) {
  const ref = React.useRef(null);
  useEffect(() => {
    const kinds = theme.particle;
    const el0 = ref.current;
    if (!kinds || !el0) return;
    const spawn = () => {
      const kind = fxPickKind(kinds);
      const el = document.createElement("div");
      el.className = "tfx-particle";
      el.style.left = (Math.random() * 92 + 2) + "%";
      el.style.fontSize = (10 + Math.random() * 6) + "px";
      el.style.setProperty("--dx", (Math.random() * 26 - 13) + "px");
      if (kind === "lantern" || kind === "balloon" || kind === "glow") {
        el.style.top = "88%";
        el.style.animation = `tfxRise ${(3 + Math.random() * 1.5).toFixed(1)}s linear forwards`;
      } else {
        el.style.top = "-10px";
        el.style.animation = `tfxDrift ${(2.6 + Math.random() * 1.4).toFixed(1)}s linear forwards`;
      }
      if (!fxDecorate(el, kind)) return;
      el0.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    };
    for (let i = 0; i < 4; i++) setTimeout(spawn, i * 220);
    const t = setInterval(spawn, 600);
    return () => { clearInterval(t); if (el0) el0.innerHTML = ""; };
  }, [theme]);

  return (
    <>
      {(theme.scene || []).map((item, i) => {
        const cls = { sway: "sway", still: "still", patrol: "patrol", patrolsmall: "patrolsmall" }[item.anim] || "";
        return (
          <div key={i} className={"tfx-mascot" + (cls ? " " + cls : "")}
            style={{ left: item.left + "%", top: item.top + "%", fontSize: item.size, animationDelay: item.delay ? item.delay + "s" : undefined }}>
            {item.e}
          </div>
        );
      })}
      <div ref={ref} className="tfx-particles" />
    </>
  );
}

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
function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}
function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}
// เลื่อนวันครบกำหนดชำระไปข้างหน้า 1 เดือนเสมอ (ไม่อิงวันที่จ่ายจริง)
// เช่น ครบกำหนด 1 ต.ค. รอบถัดไปจะเป็น 1 พ.ย. แม้ผู้เช่าจะจ่ายช้าหรือเร็วกว่านั้นก็ตาม
function addOneMonth(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + 1);
  if (d.getDate() !== originalDay) d.setDate(0); // เดือนสั้นกว่า (เช่น ก.พ.) ให้ใช้วันสุดท้ายของเดือนนั้น
  return d.toISOString().slice(0, 10);
}
function nextDueDate(prevDueDate) {
  return prevDueDate ? addOneMonth(prevDueDate) : defaultDueDate();
}
function formatThaiDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
// ยังไม่ให้กรอกมิเตอร์ถ้ายังไม่ถึงวันครบกำหนด (ถ้ารอบไหนไม่มีวันครบกำหนด ให้กรอกได้ตามปกติ)
function isMeterEntryAllowed(cycle) {
  if (!cycle || !cycle.due_date) return true;
  return daysSince(cycle.due_date) >= 0;
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
function MeterPhoto({ path, label, bucket = "meter-photos" }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let active = true;
    if (!path) { setUrl(null); return; }
    supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data }) => {
      if (active && data) setUrl(data.signedUrl);
    });
    return () => { active = false; };
  }, [path, bucket]);
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] mb-1" style={{ color: C.inkSoft }}>{label}</span>
      {url ? (
        <img src={url} alt={label} className="w-full h-24 object-cover rounded-lg" style={{ border: `1px solid ${C.line}` }} />
      ) : (
        <div className="w-full h-24 rounded-lg flex items-center justify-center" style={{ background: "#E4E1D4" }}>
          <Loader2 size={16} className="animate-spin" color={C.inkSoft} />
        </div>
      )}
    </div>
  );
}
function MeterPhotos({ cycle }) {
  if (!cycle.water_photo_path && !cycle.electric_photo_path) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {cycle.water_photo_path && <MeterPhoto path={cycle.water_photo_path} label="รูปมิเตอร์น้ำ" />}
      {cycle.electric_photo_path && <MeterPhoto path={cycle.electric_photo_path} label="รูปมิเตอร์ไฟ" />}
    </div>
  );
}
function PhotoPicker({ label, file, onChange }) {
  const previewUrl = React.useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  return (
    <label className="flex flex-col items-center justify-center gap-1 rounded-xl p-3 cursor-pointer" style={{ background: file ? C.successSoft : C.paper, border: `1px dashed ${file ? C.success : C.line}` }}>
      <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      {previewUrl ? (
        <img src={previewUrl} alt={label} className="w-full h-16 object-cover rounded-lg" />
      ) : (
        <Camera size={18} color={C.inkSoft} />
      )}
      {file ? (
        <span className="text-[10px] text-center font-semibold" style={{ color: C.success }}>✓ เลือกแล้ว: {file.name} ({Math.round(file.size / 1024)} KB)</span>
      ) : (
        <span className="text-[10px] text-center" style={{ color: C.inkSoft }}>{label}</span>
      )}
    </label>
  );
}
// ---------- รูปสัญญาเช่า (แนบได้หลายหน้า เก็บใน tenant-documents bucket) ----------
function LeaseDocThumb({ path, onDelete, deleting }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let active = true;
    supabase.storage.from("tenant-documents").createSignedUrl(path, 3600).then(({ data }) => {
      if (active && data) setUrl(data.signedUrl);
    });
    return () => { active = false; };
  }, [path]);
  return (
    <div className="relative">
      {url ? (
        <img src={url} alt="สัญญาเช่า" className="w-full h-24 object-cover rounded-lg" style={{ border: `1px solid ${C.line}` }} />
      ) : (
        <div className="w-full h-24 rounded-lg flex items-center justify-center" style={{ background: "#E4E1D4" }}>
          <Loader2 size={16} className="animate-spin" color={C.inkSoft} />
        </div>
      )}
      <button onClick={() => onDelete(path)} disabled={deleting} type="button"
        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
        <X size={12} color="#fff" />
      </button>
    </div>
  );
}
function LeaseDocsEditor({ room, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const paths = room.lease_photo_paths || [];
  const folder = room.tenant_id || room.id;

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setBusy(true); setError("");
    const uploaded = [];
    for (let i = 0; i < files.length; i++) {
      const path = `${folder}/lease-${Date.now()}-${i}.jpg`;
      const { error: upErr } = await supabase.storage.from("tenant-documents").upload(path, files[i], { upsert: true });
      if (upErr) setError((prev) => prev ? `${prev} / ${upErr.message}` : upErr.message);
      else uploaded.push(path);
    }
    if (uploaded.length) {
      await supabase.from("rooms").update({ lease_photo_paths: [...paths, ...uploaded] }).eq("id", room.id);
    }
    setBusy(false);
    onRefresh();
  };

  const deletePhoto = async (path) => {
    setBusy(true);
    await supabase.storage.from("tenant-documents").remove([path]);
    await supabase.from("rooms").update({ lease_photo_paths: paths.filter((p) => p !== path) }).eq("id", room.id);
    setBusy(false);
    onRefresh();
  };

  const clearAll = async () => {
    if (paths.length === 0) return;
    if (!window.confirm(`ลบรูปสัญญาเช่าทั้งหมด ${paths.length} รูปของห้องนี้? ใช้ตอนเปลี่ยนผู้เช่าใหม่ เพื่อไม่ให้สัญญาเก่าปนกับผู้เช่าใหม่`)) return;
    setBusy(true);
    await supabase.storage.from("tenant-documents").remove(paths);
    await supabase.from("rooms").update({ lease_photo_paths: [] }).eq("id", room.id);
    setBusy(false);
    onRefresh();
  };

  return (
    <div className="rounded-xl p-3 mb-4" style={{ background: C.paper }}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium flex items-center gap-1" style={{ color: C.inkSoft }}><ImageIcon size={12} /> รูปสัญญาเช่า (แนบได้หลายหน้า เช่น หน้า 1, หน้า 2)</label>
        {paths.length > 0 && (
          <button onClick={clearAll} disabled={busy} type="button" className="flex items-center gap-1 text-xs font-medium" style={{ color: C.alert }}>
            <Trash2 size={12} /> ลบทั้งหมด
          </button>
        )}
      </div>
      {paths.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {paths.map((p) => <LeaseDocThumb key={p} path={p} onDelete={deletePhoto} deleting={busy} />)}
        </div>
      )}
      <label className="flex items-center justify-center gap-1 rounded-xl p-2.5 cursor-pointer text-xs font-medium" style={{ background: "#fff", border: `1px dashed ${C.line}`, color: C.navy }}>
        <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <Camera size={14} /> {busy ? "กำลังอัปโหลด…" : "ถ่าย/เลือกรูปสัญญา (เลือกได้หลายรูปพร้อมกัน)"}
      </label>
      {paths.length === 0 && !busy && <p className="text-[10px] mt-1.5" style={{ color: C.inkSoft }}>แนะนำอย่างน้อย 2 รูป (เช่น หน้าแรกกับหน้าที่มีลายเซ็น)</p>}
      {error && <p className="text-xs mt-2 rounded-lg p-2" style={{ background: C.alertSoft, color: C.alert }}>{error}</p>}
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
        <MeterPhotos cycle={cycle} />

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

function HistoryPanel({ history, room, property, allowDelete = false }) {
  const [list, setList] = useState(history);
  useEffect(() => { setList(history); }, [history]);
  const [selected, setSelected] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const maxUsage = Math.max(1, ...list.flatMap((h) => [
    Math.max(0, h.curr_water - h.prev_water), Math.max(0, h.curr_electric - h.prev_electric),
  ]), 1);

  const toggleCheck = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => { setSelectMode(false); setCheckedIds(new Set()); };

  const deleteSelected = async () => {
    if (checkedIds.size === 0) return;
    if (!window.confirm(`ลบประวัติที่เลือก ${checkedIds.size} รายการ? การลบไม่สามารถย้อนกลับได้`)) return;
    setDeleting(true);
    const ids = Array.from(checkedIds);
    const photoPaths = [];
    list.forEach((h) => {
      if (ids.includes(h.id)) {
        if (h.water_photo_path) photoPaths.push(h.water_photo_path);
        if (h.electric_photo_path) photoPaths.push(h.electric_photo_path);
      }
    });
    if (photoPaths.length) await supabase.storage.from("meter-photos").remove(photoPaths);
    await supabase.from("billing_cycles").delete().in("id", ids);
    setList((prev) => prev.filter((h) => !ids.includes(h.id)));
    setDeleting(false);
    exitSelectMode();
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><History size={15} color={C.inkSoft} />
          <span className="text-xs font-semibold" style={{ color: C.inkSoft }}>ประวัติย้อนหลัง</span></div>
        {allowDelete && list.length > 0 && (
          <button onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))} className="text-xs font-medium" style={{ color: selectMode ? C.inkSoft : C.navy }}>
            {selectMode ? "ยกเลิก" : "เลือกเพื่อลบ"}
          </button>
        )}
      </div>
      {list.length === 0 ? (
        <p className="text-xs" style={{ color: C.inkSoft }}>ยังไม่มีข้อมูลย้อนหลัง</p>
      ) : (
        <div className="space-y-3">
          {list.map((h) => {
            const b = calcCycleBill(h);
            const checked = checkedIds.has(h.id);
            return (
              <div key={h.id} onClick={() => (selectMode ? toggleCheck(h.id) : setSelected(h))}
                className="w-full text-left rounded-xl p-3 flex items-start gap-2 cursor-pointer" style={{ background: checked ? C.alertSoft : C.paper }}>
                {selectMode && (
                  <input type="checkbox" checked={checked} onChange={() => toggleCheck(h.id)} onClick={(e) => e.stopPropagation()} className="mt-1 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: C.navy }}>{h.cycle_label}</span>
                    <span className="text-sm font-bold" style={mono}>฿{baht(b.total)}</span>
                  </div>
                  <UsageBar icon={Droplet} color={C.water} value={b.waterUnits} max={maxUsage} unit="น้ำ" />
                  <UsageBar icon={Zap} color={C.electric} value={b.electricUnits} max={maxUsage} unit="ไฟ" />
                  <div className="text-[10px] mt-1.5" style={{ color: C.inkSoft }}>{selectMode ? "แตะเพื่อเลือก" : "แตะเพื่อดูใบเสร็จ"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectMode && (
        <button onClick={deleteSelected} disabled={checkedIds.size === 0 || deleting}
          className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: checkedIds.size === 0 ? C.alertSoft : C.alert, opacity: checkedIds.size === 0 ? 0.6 : 1 }}>
          <Trash2 size={14} /> {deleting ? "กำลังลบ…" : `ลบที่เลือก (${checkedIds.size})`}
        </button>
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
function DueDateRow({ cycle }) {
  if (!cycle.due_date) return null;
  const overdueDays = daysSince(cycle.due_date);
  const isOverdue = overdueDays > 0;
  return (
    <div className="flex items-center justify-between text-xs mb-2 rounded-lg px-2 py-1.5" style={{ background: isOverdue ? C.alertSoft : C.successSoft }}>
      <span style={{ color: C.inkSoft }}>วันครบกำหนดชำระ</span>
      <span className="font-semibold" style={{ color: isOverdue ? C.alert : C.success }}>
        {formatThaiDate(cycle.due_date)}{isOverdue ? ` (เลยกำหนด ${overdueDays} วัน)` : ""}
      </span>
    </div>
  );
}
function DueDateBadge({ dueDate }) {
  if (!dueDate) return null;
  const overdueDays = daysSince(dueDate);
  const isOverdue = overdueDays > 0;
  return (
    <span className="text-[10px] font-semibold" style={{ color: isOverdue ? C.alert : C.success }}>
      {isOverdue ? `เลยกำหนด ${overdueDays} วัน` : `ครบกำหนด ${formatThaiDate(dueDate)}`}
    </span>
  );
}
function OverdueBanner({ cycle }) {
  const days = cycle.due_date ? daysSince(cycle.due_date) : daysSince(cycle.submitted_at) - 3;
  if (days < 1) return null;
  return (
    <div className="rounded-xl p-3 mb-4 flex items-center gap-2 text-sm font-medium" style={{ background: C.alertSoft, color: C.alert }}>
      <History size={16} /> {cycle.due_date ? `เลยกำหนดชำระมาแล้ว ${days} วัน (ครบกำหนด ${formatThaiDate(cycle.due_date)})` : `ค้างชำระมาแล้ว ${days + 3} วัน`} กรุณาชำระโดยเร็ว
    </div>
  );
}

// ---------- login ----------
function LoginScreen({ property }) {
  const [userId, setUserId] = useState(() => localStorage.getItem("baanchao_last_id") || "");
  const [password, setPassword] = useState("");
  const [rememberId, setRememberId] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: idToEmail(userId), password });
    setBusy(false);
    if (error) { setError("รหัส ID หรือรหัสผ่านไม่ถูกต้อง"); return; }
    if (rememberId) localStorage.setItem("baanchao_last_id", userId.trim());
    else localStorage.removeItem("baanchao_last_id");
  };

  const theme = getTheme(property);
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-5 tfx-header" style={{ background: theme.headerBg }}>
      <ThemeFxStyle />
      <HeaderFx theme={theme} />
      <div className="w-full max-w-sm" style={{ position: "relative", zIndex: 2 }}>
        <div className="flex flex-col items-center mb-6 text-white">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
            {property?.logo_url ? <img src={property.logo_url} alt="logo" className="w-full h-full object-cover" /> : <Home size={22} />}
          </div>
          <h1 className="text-xl font-bold" style={display}>{theme.emoji ? `${theme.emoji} ` : ""}บ้านเช่า</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{property?.name || "กำลังโหลด..."}</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl p-5" style={{ background: C.card }}>
          <label className="text-xs font-medium" style={{ color: C.inkSoft }}>รหัสผู้ใช้ (ID)</label>
          <div className="flex items-center gap-2 mt-1 mb-3 px-3 py-2 rounded-xl" style={{ border: `1px solid ${C.line}` }}>
            <Mail size={15} color={C.inkSoft} />
            <input value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full text-sm outline-none" style={mono} />
          </div>
          <label className="text-xs font-medium" style={{ color: C.inkSoft }}>รหัสผ่าน</label>
          <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl" style={{ border: `1px solid ${C.line}` }}>
            <Lock size={15} color={C.inkSoft} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-sm outline-none" style={mono} placeholder="••••••••" />
          </div>
          {error && <p className="text-xs mt-2" style={{ color: C.alert }}>{error}</p>}
          <label className="flex items-center gap-2 mt-3 text-xs" style={{ color: C.inkSoft }}>
            <input type="checkbox" checked={rememberId} onChange={(e) => setRememberId(e.target.checked)} />
            จดจำรหัส ID ไว้ในเครื่องนี้
          </label>
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
  const [propDraft, setPropDraft] = useState({ name: property?.name || "", logo_url: property?.logo_url || "", payment_qr_url: property?.payment_qr_url || "", theme: property?.theme || "default" });
  const [addForm, setAddForm] = useState({ label: "", tenantId: "", rent: "", prevWater: "0", prevElectric: "0" });
  const [addError, setAddError] = useState("");
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [dueDateDraft, setDueDateDraft] = useState("");
  const [tenantProfile, setTenantProfile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [waterReading, setWaterReading] = useState(0);
  const [electricReading, setElectricReading] = useState(0);
  const [waterPhoto, setWaterPhoto] = useState(null);
  const [electricPhoto, setElectricPhoto] = useState(null);
  const [readingError, setReadingError] = useState("");
  const [submittingReading, setSubmittingReading] = useState(false);
  const [editingMeter, setEditingMeter] = useState(false);
  const [editWater, setEditWater] = useState(0);
  const [editElectric, setEditElectric] = useState(0);
  const [editMeterError, setEditMeterError] = useState("");
  const [savingMeterEdit, setSavingMeterEdit] = useState(false);
  const [editWaterPhoto, setEditWaterPhoto] = useState(null);
  const [editElectricPhoto, setEditElectricPhoto] = useState(null);
  const [meterMode, setMeterModeState] = useState(true);

  const room = rooms.find((r) => r.id === selectedId);
  const cycle = room ? cyclesByRoom[room.id] : null;
  const bill = calcCycleBill(cycle);

  const openRoom = async (r) => {
    setSelectedId(r.id);
    setRentDraft(r.rent);
    setPhotoDraft(r.photo || "");
    setPasswordDraft(""); setPasswordMsg(""); setPasswordError("");
    setDueDateDraft(cyclesByRoom[r.id]?.due_date || "");
    setTenantProfile(null);
    const rc = cyclesByRoom[r.id];
    setWaterReading(rc ? rc.prev_water : 0);
    setElectricReading(rc ? rc.prev_electric : 0);
    setWaterPhoto(null); setElectricPhoto(null); setReadingError("");
    setEditingMeter(false); setEditMeterError("");
    setEditWater(rc ? (rc.curr_water ?? rc.prev_water) : 0);
    setEditElectric(rc ? (rc.curr_electric ?? rc.prev_electric) : 0);
    setEditWaterPhoto(null); setEditElectricPhoto(null);
    setMeterModeState(r.landlord_fills_meter !== false);
    const { data } = await supabase.from("billing_cycles").select("*").eq("room_id", r.id).eq("status", "paid").order("created_at", { ascending: false });
    setHistory(data || []);
    if (r.tenant_id) {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", r.tenant_id).single();
      setTenantProfile(prof || null);
    }
  };

  const submitMeterReading = async () => {
    if (!cycle) return;
    setSubmittingReading(true);
    setReadingError("");
    const updates = { curr_water: Number(waterReading), curr_electric: Number(electricReading), status: "awaiting_payment", submitted_at: new Date().toISOString() };
    if (waterPhoto) {
      const path = `${room.id}/${cycle.id}-water-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("meter-photos").upload(path, waterPhoto, { upsert: true });
      if (error) setReadingError(`อัปโหลดรูปน้ำไม่สำเร็จ: ${error.message}`);
      else updates.water_photo_path = path;
    }
    if (electricPhoto) {
      const path = `${room.id}/${cycle.id}-electric-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("meter-photos").upload(path, electricPhoto, { upsert: true });
      if (error) setReadingError((prev) => prev ? `${prev} / อัปโหลดรูปไฟไม่สำเร็จ: ${error.message}` : `อัปโหลดรูปไฟไม่สำเร็จ: ${error.message}`);
      else updates.electric_photo_path = path;
    }
    await supabase.from("billing_cycles").update(updates).eq("id", cycle.id);
    await rotateOldPhotos(room.id);
    setSubmittingReading(false);
    onRefresh();
  };

  const saveMeterEdit = async () => {
    if (!cycle) return;
    if (Number(editWater) < cycle.prev_water) { setEditMeterError("เลขมิเตอร์น้ำต้องไม่น้อยกว่าเลขครั้งก่อน (" + cycle.prev_water + ")"); return; }
    if (Number(editElectric) < cycle.prev_electric) { setEditMeterError("เลขมิเตอร์ไฟต้องไม่น้อยกว่าเลขครั้งก่อน (" + cycle.prev_electric + ")"); return; }
    setEditMeterError("");
    setSavingMeterEdit(true);
    const updates = { curr_water: Number(editWater), curr_electric: Number(editElectric) };
    if (editWaterPhoto) {
      const path = `${room.id}/${cycle.id}-water-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("meter-photos").upload(path, editWaterPhoto, { upsert: true });
      if (error) setEditMeterError(`อัปโหลดรูปน้ำไม่สำเร็จ: ${error.message}`);
      else updates.water_photo_path = path;
    }
    if (editElectricPhoto) {
      const path = `${room.id}/${cycle.id}-electric-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("meter-photos").upload(path, editElectricPhoto, { upsert: true });
      if (error) setEditMeterError((prev) => prev ? `${prev} / อัปโหลดรูปไฟไม่สำเร็จ: ${error.message}` : `อัปโหลดรูปไฟไม่สำเร็จ: ${error.message}`);
      else updates.electric_photo_path = path;
    }
    await supabase.from("billing_cycles").update(updates).eq("id", cycle.id);
    if (editWaterPhoto || editElectricPhoto) await rotateOldPhotos(room.id);
    setSavingMeterEdit(false);
    setEditingMeter(false);
    onRefresh();
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
  const saveDueDate = async () => {
    if (!cycle) return;
    setBusy(true);
    await supabase.from("billing_cycles").update({ due_date: dueDateDraft || null }).eq("id", cycle.id);
    setBusy(false); onRefresh();
  };
  const setMeterMode = async (landlordFills) => {
    if (!room) return;
    setMeterModeState(landlordFills);
    setBusy(true);
    await supabase.from("rooms").update({ landlord_fills_meter: landlordFills }).eq("id", room.id);
    setBusy(false); onRefresh();
  };
  const changeTenantPassword = async () => {
    setPasswordError(""); setPasswordMsg("");
    if (!passwordDraft || passwordDraft.length < 6) { setPasswordError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("change-tenant-password", {
      body: { userId: room.tenant_id, newPassword: passwordDraft },
    });
    setBusy(false);
    if (error || data?.error) setPasswordError(data?.error || error.message);
    else { setPasswordMsg("เปลี่ยนรหัสผ่านสำเร็จแล้ว"); setPasswordDraft(""); }
  };
  const saveRates = async () => {
    setBusy(true);
    await supabase.from("rates").update({ water_rate: Number(rateDraft.water), electric_rate: Number(rateDraft.electric) }).eq("id", 1);
    await supabase.from("property_settings").update({ name: propDraft.name, logo_url: propDraft.logo_url, payment_qr_url: propDraft.payment_qr_url, theme: propDraft.theme }).eq("id", 1);
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
      due_date: defaultDueDate(),
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
          <button onClick={() => { setPropDraft({ name: property?.name || "", logo_url: property?.logo_url || "", payment_qr_url: property?.payment_qr_url || "", theme: property?.theme || "default" }); setRateDraft({ water: rates?.water_rate, electric: rates?.electric_rate }); setShowSettings(true); }}
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
                <div className="flex flex-col items-end gap-1">
                  {c && <Badge status={c.status} />}
                  {c && c.status !== "paid" && <DueDateBadge dueDate={c.due_date} />}
                </div>
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
            <label className="text-xs font-medium" style={{ color: C.inkSoft }}>ธีมตามเทศกาล (เปลี่ยนสีหัวแอปทั้งระบบ)</label>
            <select value={propDraft.theme} onChange={(e) => setPropDraft({ ...propDraft, theme: e.target.value })}
              className="w-full mt-1 mb-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}` }}>
              <option value="auto">🪄 อัตโนมัติ (เปลี่ยนตามวันสำคัญให้เอง)</option>
              {["เริ่มต้น", "เทศกาลรื่นเริง", "วันสำคัญทางพุทธศาสนา", "วันสำคัญของชาติ"].map((cat) => (
                <optgroup key={cat} label={cat}>
                  {Object.entries(THEMES).filter(([, t]) => t.category === cat).map(([key, t]) => (
                    <option key={key} value={key}>{t.emoji ? `${t.emoji} ` : ""}{t.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-[11px] -mt-1 mb-3" style={{ color: C.inkSoft }}>
              เลือก "อัตโนมัติ" ให้ระบบเปลี่ยนธีมตามวันสำคัญเอง (ขึ้นก่อนวันจริง 7 วัน และอยู่ต่ออีก 7 วัน) หรือเลือกธีมเองตายตัวก็ได้ เลือกแล้วกด "บันทึก" ด้านล่าง เปลี่ยนกลับเป็น "ปกติ" ได้ตลอดเวลา
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

            <div className="rounded-xl p-3 mb-4" style={{ background: C.paper }}>
              <label className="text-xs font-medium flex items-center gap-1" style={{ color: C.inkSoft }}><Lock size={12} /> ใครเป็นคนกรอกมิเตอร์ห้องนี้</label>
              <p className="text-[11px] mt-0.5 mb-2" style={{ color: C.inkSoft }}>ล็อกไว้ที่ "เจ้าของบ้าน" เผื่อผู้เช่าห้องนี้กรอกเลขมิเตอร์ผิดบ่อย</p>
              <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                <button onClick={() => setMeterMode(true)} disabled={busy}
                  className="flex-1 py-2 text-xs font-semibold" style={{ background: meterMode ? C.navy : "#fff", color: meterMode ? "#fff" : C.inkSoft }}>
                  เจ้าของบ้านกรอกเอง
                </button>
                <button onClick={() => setMeterMode(false)} disabled={busy}
                  className="flex-1 py-2 text-xs font-semibold" style={{ background: !meterMode ? C.navy : "#fff", color: !meterMode ? "#fff" : C.inkSoft }}>
                  ให้ผู้เช่ากรอกเอง
                </button>
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4" style={{ background: C.paper }}>
              <label className="text-xs font-medium flex items-center gap-1" style={{ color: C.inkSoft }}><Lock size={12} /> ตั้งรหัสผ่านใหม่ให้ผู้เช่า</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="text" placeholder="อย่างน้อย 6 ตัวอักษร" value={passwordDraft} onChange={(e) => setPasswordDraft(e.target.value)} className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, background: "#fff", ...mono }} />
                <button onClick={changeTenantPassword} disabled={busy} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: C.navy }}>บันทึก</button>
              </div>
              {passwordMsg && <p className="text-xs mt-2" style={{ color: C.success }}>{passwordMsg}</p>}
              {passwordError && <p className="text-xs mt-2" style={{ color: C.alert }}>{passwordError}</p>}
            </div>

            {cycle && (
              <div className="rounded-xl p-3 mb-4" style={{ background: C.paper }}>
                <label className="text-xs font-medium" style={{ color: C.inkSoft }}>วันครบกำหนดชำระ (รอบนี้)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="date" value={dueDateDraft} onChange={(e) => setDueDateDraft(e.target.value)} className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, background: "#fff", ...mono }} />
                  <button onClick={saveDueDate} disabled={busy} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: C.navy }}>บันทึก</button>
                </div>
              </div>
            )}

            {tenantProfile && (
              <div className="rounded-xl p-3 mb-4" style={{ background: C.paper }}>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: C.inkSoft }}><User size={12} /> ข้อมูลผู้เช่า</p>
                <div className="space-y-1.5 text-sm">
                  <Row label="ชื่อ" value={tenantProfile.full_name || "-"} />
                  <Row label="เบอร์โทร" value={tenantProfile.phone || "-"} />
                  <Row label="LINE ID" value={tenantProfile.line_id || "-"} />
                </div>
                {tenantProfile.id_card_photo_path ? (
                  <div className="mt-2 w-24">
                    <MeterPhoto path={tenantProfile.id_card_photo_path} label="รูปบัตรประชาชน" bucket="tenant-documents" />
                  </div>
                ) : (
                  <p className="text-xs mt-2" style={{ color: C.inkSoft }}>ผู้เช่ายังไม่ได้แนบรูปบัตรประชาชน</p>
                )}
              </div>
            )}

            <LeaseDocsEditor room={room} onRefresh={onRefresh} />

            {!cycle ? (
              <div className="rounded-xl p-4 text-sm" style={{ background: C.alertSoft, color: C.alert }}>ยังไม่มีรอบบิลของห้องนี้</div>
            ) : cycle.status === "awaiting_reading" && room.landlord_fills_meter === false ? (
              <div className="rounded-xl p-4 text-sm" style={{ background: C.alertSoft, color: C.alert }}>ผู้เช่ายังไม่ได้กรอกมิเตอร์น้ำไฟของรอบนี้</div>
            ) : cycle.status === "awaiting_reading" && !isMeterEntryAllowed(cycle) ? (
              <div className="rounded-xl p-4 text-sm" style={{ background: C.paper }}>
                <p style={{ color: C.inkSoft }}>ยังไม่ถึงวันครบกำหนดของรอบนี้ — กรอกมิเตอร์ได้ตั้งแต่วันที่ <b style={{ color: C.navy }}>{formatThaiDate(cycle.due_date)}</b></p>
              </div>
            ) : cycle.status === "awaiting_reading" ? (
              <div className="rounded-xl p-3" style={{ background: C.paper }}>
                <p className="text-sm font-semibold mb-1" style={{ color: C.navy }}>กรอกมิเตอร์รอบนี้ — {cycle.cycle_label}</p>
                <p className="text-xs mb-2" style={{ color: C.inkSoft }}>เลขมิเตอร์ครั้งก่อน — น้ำ {cycle.prev_water} · ไฟ {cycle.prev_electric}</p>
                <DueDateRow cycle={cycle} />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Gauge value={Math.max(0, waterReading - cycle.prev_water)} max={20} color={C.water} softColor={C.waterSoft} icon={Droplet} label="น้ำ (หน่วยที่ใช้)" unitLabel="หน่วย" />
                  <Gauge value={Math.max(0, electricReading - cycle.prev_electric)} max={150} color={C.electric} softColor={C.electricSoft} icon={Zap} label="ไฟ (หน่วยที่ใช้)" unitLabel="หน่วย" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs" style={{ color: C.inkSoft }}>เลขมิเตอร์น้ำปัจจุบัน</label>
                    <input type="number" value={waterReading} onChange={(e) => setWaterReading(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, background: "#fff", ...mono }} /></div>
                  <div><label className="text-xs" style={{ color: C.inkSoft }}>เลขมิเตอร์ไฟปัจจุบัน</label>
                    <input type="number" value={electricReading} onChange={(e) => setElectricReading(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, background: "#fff", ...mono }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <PhotoPicker label="ถ่ายรูปมิเตอร์น้ำ" file={waterPhoto} onChange={setWaterPhoto} />
                  <PhotoPicker label="ถ่ายรูปมิเตอร์ไฟ" file={electricPhoto} onChange={setElectricPhoto} />
                </div>
                <p className="text-[10px] mt-2" style={{ color: C.inkSoft }}>แนบรูปได้ไม่บังคับ — ระบบเก็บรูปไว้แค่ 6 เดือนล่าสุด</p>
                {readingError && <p className="text-xs mt-2 rounded-lg p-2" style={{ background: C.alertSoft, color: C.alert }}>{readingError}</p>}
                <button onClick={submitMeterReading} disabled={submittingReading} className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
                  {submittingReading ? "กำลังบันทึก…" : "บันทึกค่ามิเตอร์ & แจ้งบิลผู้เช่า"}
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <DueDateRow cycle={cycle} />
                {editingMeter ? (
                  <div className="rounded-xl p-3" style={{ background: C.paper }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: C.inkSoft }}>แก้ไขเลขมิเตอร์ (เลขครั้งก่อน — น้ำ {cycle.prev_water} · ไฟ {cycle.prev_electric})</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs" style={{ color: C.inkSoft }}>เลขมิเตอร์น้ำ</label>
                        <input type="number" value={editWater} onChange={(e) => setEditWater(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, background: "#fff", ...mono }} /></div>
                      <div><label className="text-xs" style={{ color: C.inkSoft }}>เลขมิเตอร์ไฟ</label>
                        <input type="number" value={editElectric} onChange={(e) => setEditElectric(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, background: "#fff", ...mono }} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <PhotoPicker label="ถ่ายรูปมิเตอร์น้ำ" file={editWaterPhoto} onChange={setEditWaterPhoto} />
                      <PhotoPicker label="ถ่ายรูปมิเตอร์ไฟ" file={editElectricPhoto} onChange={setEditElectricPhoto} />
                    </div>
                    <p className="text-[10px] mt-2" style={{ color: C.inkSoft }}>แนบรูปได้ไม่บังคับ — ถ้าไม่เลือกรูปใหม่ รูปเดิม (ถ้ามี) จะยังอยู่เหมือนเดิม</p>
                    {editMeterError && <p className="text-xs mt-2 rounded-lg p-2" style={{ background: C.alertSoft, color: C.alert }}>{editMeterError}</p>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={saveMeterEdit} disabled={savingMeterEdit} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: C.navy }}>
                        {savingMeterEdit ? "กำลังบันทึก…" : "บันทึกค่าที่แก้"}
                      </button>
                      <button onClick={() => { setEditingMeter(false); setEditMeterError(""); setEditWaterPhoto(null); setEditElectricPhoto(null); }} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.inkSoft }}>
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <MeterCompare cycle={cycle} />
                    {cycle.status !== "paid" && (
                      <button onClick={() => { setEditWater(cycle.curr_water ?? cycle.prev_water); setEditElectric(cycle.curr_electric ?? cycle.prev_electric); setEditWaterPhoto(null); setEditElectricPhoto(null); setEditingMeter(true); }}
                        className="flex items-center gap-1 text-xs font-medium" style={{ color: C.navy }}>
                        <Pencil size={12} /> แก้ไขเลขมิเตอร์ (กรณีลงผิด)
                      </button>
                    )}
                  </>
                )}
                <MeterPhotos cycle={cycle} />
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
            <HistoryPanel history={history} room={room} property={property} allowDelete />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- tenant ----------
function TenantView({ room, cycle, rates, property, onRefresh }) {
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [water, setWater] = useState(cycle ? cycle.prev_water : 0);
  const [electric, setElectric] = useState(cycle ? cycle.prev_electric : 0);
  const [waterPhoto, setWaterPhoto] = useState(null);
  const [electricPhoto, setElectricPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    if (!room) return;
    supabase.from("billing_cycles").select("*").eq("room_id", room.id).eq("status", "paid").order("created_at", { ascending: false })
      .then(({ data }) => setHistory(data || []));
  }, [room, cycle?.status]);

  useEffect(() => {
    if (cycle) { setWater(cycle.prev_water); setElectric(cycle.prev_electric); setWaterPhoto(null); setElectricPhoto(null); setPhotoError(""); }
  }, [cycle?.id]);

  if (!room || !cycle) return <Spinner label="กำลังโหลดข้อมูลห้อง…" />;
  const bill = calcCycleBill(cycle);
  const landlordFills = room.landlord_fills_meter !== false;

  const submitReading = async () => {
    setProcessing(true);
    setPhotoError("");
    const updates = { curr_water: Number(water), curr_electric: Number(electric), status: "awaiting_payment", submitted_at: new Date().toISOString() };
    if (waterPhoto) {
      const path = `${room.id}/${cycle.id}-water-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("meter-photos").upload(path, waterPhoto, { upsert: true });
      if (error) setPhotoError(`อัปโหลดรูปน้ำไม่สำเร็จ: ${error.message}`);
      else updates.water_photo_path = path;
    }
    if (electricPhoto) {
      const path = `${room.id}/${cycle.id}-electric-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("meter-photos").upload(path, electricPhoto, { upsert: true });
      if (error) setPhotoError((prev) => prev ? `${prev} / อัปโหลดรูปไฟไม่สำเร็จ: ${error.message}` : `อัปโหลดรูปไฟไม่สำเร็จ: ${error.message}`);
      else updates.electric_photo_path = path;
    }
    await supabase.from("billing_cycles").update(updates).eq("id", cycle.id);
    await rotateOldPhotos(room.id);
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
        landlordFills ? (
          <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex flex-col items-center text-center py-4">
              <Droplet size={28} color={C.water} />
              <h2 className="font-bold mt-3" style={{ color: C.navy, ...display }}>รอเจ้าของบ้านกรอกมิเตอร์</h2>
              <p className="text-sm mt-1" style={{ color: C.inkSoft }}>รอบบิล {cycle.cycle_label} — เจ้าของบ้านจะเป็นผู้บันทึกค่าน้ำและค่าไฟ เมื่อบันทึกเสร็จ บิลจะแสดงที่นี่ให้คุณชำระเงิน</p>
            </div>
            <HistoryPanel history={history} room={room} property={property} />
          </div>
        ) : !isMeterEntryAllowed(cycle) ? (
          <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex flex-col items-center text-center py-4">
              <Droplet size={28} color={C.water} />
              <h2 className="font-bold mt-3" style={{ color: C.navy, ...display }}>ยังไม่ถึงวันกรอกมิเตอร์</h2>
              <p className="text-sm mt-1" style={{ color: C.inkSoft }}>รอบบิล {cycle.cycle_label} — กรอกมิเตอร์ได้ตั้งแต่วันที่ <b style={{ color: C.navy }}>{formatThaiDate(cycle.due_date)}</b></p>
            </div>
            <HistoryPanel history={history} room={room} property={property} />
          </div>
        ) : (
          <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <h2 className="font-bold mb-1" style={{ color: C.navy, ...display }}>กรอกมิเตอร์รอบนี้ — {cycle.cycle_label}</h2>
            <p className="text-xs mb-2" style={{ color: C.inkSoft }}>เลขมิเตอร์ครั้งก่อน — น้ำ {cycle.prev_water} · ไฟ {cycle.prev_electric}</p>
            <DueDateRow cycle={cycle} />
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
            <div className="grid grid-cols-2 gap-3 mt-3">
              <PhotoPicker label="ถ่ายรูปมิเตอร์น้ำ" file={waterPhoto} onChange={setWaterPhoto} />
              <PhotoPicker label="ถ่ายรูปมิเตอร์ไฟ" file={electricPhoto} onChange={setElectricPhoto} />
            </div>
            <p className="text-[10px] mt-2" style={{ color: C.inkSoft }}>แนบรูปได้ไม่บังคับ — ระบบเก็บรูปไว้แค่ 6 เดือนล่าสุด รูปเก่ากว่านั้นจะถูกลบอัตโนมัติ (ตัวเลขมิเตอร์ยังเก็บถาวร)</p>
            {photoError && <p className="text-xs mt-2 rounded-lg p-2" style={{ background: C.alertSoft, color: C.alert }}>{photoError}</p>}
            <button onClick={submitReading} disabled={processing} className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
              {processing ? "กำลังส่ง…" : "ส่งค่ามิเตอร์"}
            </button>
            <HistoryPanel history={history} room={room} property={property} />
          </div>
        )
      )}

      {cycle.status === "awaiting_payment" && (
        <>
          <OverdueBanner cycle={cycle} />
          <div className="rounded-2xl p-5 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <h2 className="font-bold mb-3" style={{ color: C.navy, ...display }}>บิลรอบนี้ — {room.label} ({cycle.cycle_label})</h2>
            <DueDateRow cycle={cycle} />
            <MeterCompare cycle={cycle} />
            <MeterPhotos cycle={cycle} />
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
// ---------- keep only the 6 most recent meter photos per room (ประมาณ 6 เดือน เพราะปิดรอบเดือนละครั้ง) ----------
async function rotateOldPhotos(roomId) {
  const { data: cycles } = await supabase.from("billing_cycles")
    .select("id, water_photo_path, electric_photo_path")
    .eq("room_id", roomId)
    .or("water_photo_path.not.is.null,electric_photo_path.not.is.null")
    .order("created_at", { ascending: false });
  if (!cycles || cycles.length <= 6) return;
  const toClear = cycles.slice(6);
  const paths = [];
  toClear.forEach((c) => {
    if (c.water_photo_path) paths.push(c.water_photo_path);
    if (c.electric_photo_path) paths.push(c.electric_photo_path);
  });
  if (paths.length) await supabase.storage.from("meter-photos").remove(paths);
  await Promise.all(toClear.map((c) =>
    supabase.from("billing_cycles").update({ water_photo_path: null, electric_photo_path: null }).eq("id", c.id)
  ));
}

async function closeCycleAndAdvance(cycle, room, rates, method) {
  const bill = calcCycleBill(cycle);
  await supabase.from("billing_cycles").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", cycle.id);
  await supabase.from("payments").insert({ billing_cycle_id: cycle.id, method, amount: bill.total, status: "succeeded" });
  await supabase.from("billing_cycles").insert({
    room_id: room.id, cycle_label: currentCycleLabel(),
    prev_water: cycle.curr_water, prev_electric: cycle.curr_electric,
    rent: room.rent, water_rate: rates.water_rate, electric_rate: rates.electric_rate, status: "awaiting_reading",
    due_date: nextDueDate(cycle.due_date),
  });
}

// ---------- app root ----------
// ---------- shop: landlord ----------
function ShopLandlordView() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("orders");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", photo: "", description: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: p } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(p || []);
    const { data: o } = await supabase.from("shop_orders").select("*, shop_order_items(*), rooms(label)").order("created_at", { ascending: false });
    setOrders(o || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const addProduct = async () => {
    if (!form.name.trim() || !Number(form.price)) return;
    setBusy(true);
    await supabase.from("products").insert({ name: form.name.trim(), price: Number(form.price), photo: form.photo || null, description: form.description.trim() || null });
    setBusy(false); setShowAdd(false); setForm({ name: "", price: "", photo: "", description: "" }); load();
  };
  const toggleActive = async (p) => {
    await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    load();
  };
  const removeProduct = async (p) => {
    await supabase.from("products").delete().eq("id", p.id);
    load();
  };
  const confirmOrder = async (order) => {
    setBusy(true);
    await supabase.from("shop_orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);
    setBusy(false); load();
  };
  const markCashPaid = async (order) => {
    setBusy(true);
    await supabase.from("shop_orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);
    setBusy(false); load();
  };

  const pendingOrders = orders.filter((o) => o.status !== "paid");
  const paidOrders = orders.filter((o) => o.status === "paid").slice(0, 20);

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: C.navy, ...display }}>ร้านค้า</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white" style={{ background: C.navy }}>
          <Plus size={16} /> เพิ่มสินค้า
        </button>
      </div>

      <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
        <button onClick={() => setTab("orders")} className="flex-1 py-2.5 text-sm font-medium" style={{ background: tab === "orders" ? C.navy : "#fff", color: tab === "orders" ? "#fff" : C.inkSoft }}>คำสั่งซื้อ</button>
        <button onClick={() => setTab("products")} className="flex-1 py-2.5 text-sm font-medium" style={{ background: tab === "products" ? C.navy : "#fff", color: tab === "products" ? "#fff" : C.inkSoft }}>จัดการสินค้า</button>
      </div>

      {tab === "products" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.length === 0 && <p className="text-sm col-span-2" style={{ color: C.inkSoft }}>ยังไม่มีสินค้า กด "เพิ่มสินค้า" เพื่อเริ่มต้น</p>}
          {products.map((p) => (
            <div key={p.id} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: C.card, border: `1px solid ${C.line}`, opacity: p.active ? 1 : 0.5 }}>
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: C.paper }}>
                {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : <ShoppingCart size={18} color={C.inkSoft} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm break-words" style={{ color: C.navy }}>{p.name}</div>
                {p.description && <div className="text-xs mt-0.5 break-words" style={{ color: C.inkSoft }}>{p.description}</div>}
                <div className="text-sm mt-0.5" style={mono}>฿{baht(p.price)}</div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => toggleActive(p)} className="text-[10px] px-2 py-1 rounded-full font-semibold" style={{ background: p.active ? C.successSoft : C.paper, color: p.active ? C.success : C.inkSoft }}>
                  {p.active ? "กำลังขาย" : "ปิดขาย"}
                </button>
                <button onClick={() => removeProduct(p)} className="text-[10px] px-2 py-1 rounded-full font-semibold flex items-center justify-center gap-1" style={{ background: C.alertSoft, color: C.alert }}>
                  <Trash2 size={10} /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: C.inkSoft }}>รอดำเนินการ</p>
            {pendingOrders.length === 0 && <p className="text-sm" style={{ color: C.inkSoft }}>ไม่มีคำสั่งซื้อค้างอยู่</p>}
            <div className="space-y-3">
              {pendingOrders.map((o) => (
                <div key={o.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm" style={{ color: C.navy }}>{o.rooms?.label || "ห้อง"}</span>
                    <Badge status={o.status === "awaiting_confirmation" ? "awaiting_confirmation" : "awaiting_payment"} />
                  </div>
                  <div className="space-y-1 text-xs mb-2" style={{ color: C.inkSoft }}>
                    {(o.shop_order_items || []).map((it) => (
                      <div key={it.id} className="flex justify-between"><span>{it.product_name} × {it.quantity}</span><span style={mono}>฿{baht(it.subtotal)}</span></div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px dashed ${C.line}` }}>
                    <span className="text-xs font-semibold" style={{ color: C.navy }}>รวม</span>
                    <span className="font-bold" style={mono}>฿{baht(o.total)}</span>
                  </div>
                  {o.status === "awaiting_confirmation" ? (
                    <button onClick={() => confirmOrder(o)} disabled={busy} className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2" style={{ background: C.success }}>
                      <Wallet size={14} /> ยืนยันได้รับเงินแล้ว
                    </button>
                  ) : (
                    <button onClick={() => markCashPaid(o)} disabled={busy} className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2" style={{ background: C.success }}>
                      <Wallet size={14} /> บันทึกว่าได้รับเงินสดแล้ว
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: C.inkSoft }}>ประวัติ (ชำระแล้ว)</p>
            {paidOrders.length === 0 && <p className="text-sm" style={{ color: C.inkSoft }}>ยังไม่มีประวัติ</p>}
            <div className="space-y-2">
              {paidOrders.map((o) => (
                <div key={o.id} className="rounded-xl p-3 flex items-center justify-between text-sm" style={{ background: C.paper }}>
                  <span style={{ color: C.navy }}>{o.rooms?.label} — {new Date(o.paid_at).toLocaleDateString("th-TH")}</span>
                  <span className="font-semibold" style={mono}>฿{baht(o.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center" style={{ background: "rgba(22,38,59,0.45)" }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5" style={{ background: C.card }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: C.navy, ...display }}>เพิ่มสินค้าใหม่</h3>
              <button onClick={() => setShowAdd(false)}><X size={18} color={C.inkSoft} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs font-medium" style={{ color: C.inkSoft }}>ชื่อสินค้า</label>
                <input placeholder="เช่น น้ำดื่มถังใหญ่" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}` }} /></div>
              <div><label className="text-xs font-medium" style={{ color: C.inkSoft }}>คำอธิบาย (ไม่บังคับ)</label>
                <textarea placeholder="เช่น ขนาด 600 มล. แพ็ค 6 ขวด" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none resize-none" style={{ border: `1px solid ${C.line}` }} /></div>
              <div><label className="text-xs font-medium" style={{ color: C.inkSoft }}>ราคา (บาท)</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} /></div>
              <div><label className="text-xs font-medium" style={{ color: C.inkSoft }}>รูปภาพ (ลิงก์รูปภาพ ไม่บังคับ)</label>
                <input placeholder="https://..." value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}` }} /></div>
              <button onClick={addProduct} disabled={busy} className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
                {busy ? "กำลังเพิ่ม…" : "เพิ่มสินค้า"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- shop: tenant ----------
function ShopTenantView({ room, property }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [openOrder, setOpenOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    if (!room) return;
    const { data: p } = await supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false });
    setProducts(p || []);
    const { data: open } = await supabase.from("shop_orders").select("*, shop_order_items(*)").eq("room_id", room.id).neq("status", "paid").order("created_at", { ascending: false }).maybeSingle();
    setOpenOrder(open || null);
    const { data: paid } = await supabase.from("shop_orders").select("*, shop_order_items(*)").eq("room_id", room.id).eq("status", "paid").order("created_at", { ascending: false }).limit(10);
    setHistory(paid || []);
  }, [room]);
  useEffect(() => { load(); }, [load]);

  if (!room) return <Spinner label="กำลังโหลดข้อมูลห้อง…" />;

  const cartItems = products.filter((p) => cart[p.id] > 0).map((p) => ({ ...p, qty: cart[p.id] }));
  const cartTotal = cartItems.reduce((sum, it) => sum + it.price * it.qty, 0);

  const setQty = (id, qty) => setCart((prev) => ({ ...prev, [id]: Math.max(0, qty) }));

  const checkout = async () => {
    if (cartItems.length === 0) return;
    setProcessing(true);
    const { data: order } = await supabase.from("shop_orders").insert({ room_id: room.id, status: "awaiting_payment", total: cartTotal }).select().single();
    if (order) {
      await supabase.from("shop_order_items").insert(cartItems.map((it) => ({ order_id: order.id, product_name: it.name, unit_price: it.price, quantity: it.qty, subtotal: it.price * it.qty })));
    }
    setCart({}); setProcessing(false); load();
  };

  const notifyTransferred = async () => {
    setProcessing(true);
    await supabase.from("shop_orders").update({ status: "awaiting_confirmation" }).eq("id", openOrder.id);
    setProcessing(false); load();
  };

  if (openOrder) {
    return (
      <div className="p-5 md:p-8 max-w-lg mx-auto">
        {openOrder.status === "awaiting_payment" ? (
          <>
            <div className="rounded-2xl p-5 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <h2 className="font-bold mb-3" style={{ color: C.navy, ...display }}>คำสั่งซื้อของคุณ</h2>
              <div className="space-y-2 text-sm mb-3">
                {(openOrder.shop_order_items || []).map((it) => (
                  <Row key={it.id} label={`${it.product_name} × ${it.quantity}`} value={`฿${baht(it.subtotal)}`} />
                ))}
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                <span className="font-semibold" style={{ color: C.navy }}>ยอดที่ต้องชำระ</span>
                <span className="text-2xl font-bold" style={mono}>฿{baht(openOrder.total)}</span>
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: C.navy, ...display }}><QrCode size={16} /> สแกนพร้อมเพย์เพื่อโอนเงิน</h3>
              <div className="flex flex-col items-center">
                {property?.payment_qr_url ? (
                  <img src={property.payment_qr_url} alt="พร้อมเพย์" className="w-44 h-44 object-contain rounded-xl" style={{ border: `1px solid ${C.line}` }} />
                ) : (
                  <QRMock seed={openOrder.id} />
                )}
                <p className="text-sm mt-3 font-medium" style={{ color: C.navy }}>ยอดโอน ฿{baht(openOrder.total)}</p>
              </div>
              <button onClick={notifyTransferred} disabled={processing} className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
                {processing ? "กำลังส่ง…" : "แจ้งว่าโอนเงินแล้ว"}
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl p-6 flex flex-col items-center text-center" style={{ background: C.alertSoft, border: `1px solid ${C.line}` }}>
            <QrCode size={32} color={C.alert} />
            <h2 className="font-bold mt-3" style={{ color: C.navy, ...display }}>แจ้งโอนเงินแล้ว</h2>
            <p className="text-sm mt-1" style={{ color: C.inkSoft }}>รอเจ้าของบ้านตรวจสอบและยืนยันยอด ฿{baht(openOrder.total)}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4" style={{ color: C.navy, ...display }}>ร้านค้า</h1>
      {products.length === 0 ? (
        <p className="text-sm" style={{ color: C.inkSoft }}>ยังไม่มีสินค้าวางขายตอนนี้</p>
      ) : (
        <div className="space-y-3 mb-6">
          {products.map((p) => (
            <div key={p.id} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: C.paper }}>
                {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : <ShoppingCart size={18} color={C.inkSoft} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm break-words" style={{ color: C.navy }}>{p.name}</div>
                {p.description && <div className="text-xs mt-0.5 break-words" style={{ color: C.inkSoft }}>{p.description}</div>}
                <div className="text-sm mt-0.5" style={mono}>฿{baht(p.price)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setQty(p.id, (cart[p.id] || 0) - 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.paper }}><Minus size={14} /></button>
                <span className="w-5 text-center text-sm" style={mono}>{cart[p.id] || 0}</span>
                <button onClick={() => setQty(p.id, (cart[p.id] || 0) + 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: C.navy }}><Plus size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {cartItems.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm" style={{ color: C.navy }}>รวม {cartItems.reduce((s, it) => s + it.qty, 0)} ชิ้น</span>
            <span className="text-xl font-bold" style={mono}>฿{baht(cartTotal)}</span>
          </div>
          <button onClick={checkout} disabled={processing} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
            {processing ? "กำลังสั่งซื้อ…" : "สั่งซื้อ"}
          </button>
        </div>
      )}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: C.inkSoft }}>ประวัติการสั่งซื้อ</p>
          <div className="space-y-2">
            {history.map((o) => (
              <div key={o.id} className="rounded-xl p-3" style={{ background: C.paper }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: C.inkSoft }}>{new Date(o.paid_at).toLocaleDateString("th-TH")}</span>
                  <span className="text-sm font-bold" style={mono}>฿{baht(o.total)}</span>
                </div>
                <div className="text-xs" style={{ color: C.inkSoft }}>{(o.shop_order_items || []).map((it) => `${it.product_name} ×${it.quantity}`).join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- tenant: personal profile & ID card ----------
function ProfileTenantView({ profile, onRefresh }) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [lineId, setLineId] = useState(profile.line_id || "");
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPath, setIdCardPath] = useState(profile.id_card_photo_path || null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true); setMsg(""); setError("");
    const updates = { full_name: fullName.trim(), phone: phone.trim(), line_id: lineId.trim() };
    if (idCardFile) {
      const path = `${profile.id}/id-card-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("tenant-documents").upload(path, idCardFile, { upsert: true });
      if (upErr) { setError(`อัปโหลดรูปบัตรไม่สำเร็จ: ${upErr.message}`); setBusy(false); return; }
      updates.id_card_photo_path = path;
    }
    const { error: updErr } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    setBusy(false);
    if (updErr) { setError(`บันทึกไม่สำเร็จ: ${updErr.message}`); return; }
    if (updates.id_card_photo_path) setIdCardPath(updates.id_card_photo_path);
    setIdCardFile(null);
    setMsg("บันทึกข้อมูลเรียบร้อยแล้ว");
    onRefresh();
  };

  return (
    <div className="p-5 md:p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: C.navy, ...display }}><User size={20} /> ข้อมูลส่วนตัว</h1>
      <div className="rounded-2xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div>
          <label className="text-xs font-medium" style={{ color: C.inkSoft }}>ชื่อ-นามสกุล</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}` }} />
        </div>
        <div>
          <label className="text-xs font-medium flex items-center gap-1" style={{ color: C.inkSoft }}><Phone size={12} /> เบอร์โทรศัพท์</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เช่น 081-234-5678" className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, ...mono }} />
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: C.inkSoft }}>LINE ID</label>
          <input value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="เช่น @myline หรือ myline123" className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}` }} />
        </div>
        <div>
          <label className="text-xs font-medium flex items-center gap-1 mb-1" style={{ color: C.inkSoft }}><CreditCard size={12} /> รูปบัตรประชาชน</label>
          {idCardPath && !idCardFile && <MeterPhoto path={idCardPath} label="รูปที่บันทึกไว้" bucket="tenant-documents" />}
          <div className="mt-2">
            <PhotoPicker label="ถ่ายรูปบัตรประชาชน" file={idCardFile} onChange={setIdCardFile} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: C.inkSoft }}>เก็บเป็นส่วนตัว มีแค่คุณและเจ้าของบ้านเท่านั้นที่ดูได้</p>
        </div>
        {msg && <p className="text-xs" style={{ color: C.success }}>{msg}</p>}
        {error && <p className="text-xs" style={{ color: C.alert }}>{error}</p>}
        <button onClick={save} disabled={busy} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
          {busy ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
        </button>
      </div>
    </div>
  );
}

// ---------- กฎการเช่า (เจ้าของแก้ไขได้ตลอด ผู้เช่าดูอย่างเดียว) ----------
function RulesView({ property, role, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(property?.rules || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { setDraft(property?.rules || ""); }, [property?.rules]);

  const save = async () => {
    setBusy(true); setMsg("");
    await supabase.from("property_settings").update({ rules: draft }).eq("id", 1);
    setBusy(false);
    setEditing(false);
    setMsg("บันทึกกฎการเช่าเรียบร้อยแล้ว");
    onRefresh();
  };

  const isLandlord = role === "landlord";

  return (
    <div className="p-5 md:p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: C.navy, ...display }}><FileText size={20} /> กฎการเช่า</h1>
      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        {isLandlord && editing ? (
          <>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={12}
              placeholder="เช่น ห้ามเลี้ยงสัตว์ในห้อง, ชำระค่าเช่าก่อนวันที่ 5 ของทุกเดือน, ห้ามส่งเสียงดังหลัง 22:00 น. ฯลฯ"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.line}`, lineHeight: 1.6 }} />
            <div className="flex gap-2 mt-3">
              <button onClick={save} disabled={busy} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.navy }}>
                {busy ? "กำลังบันทึก…" : "บันทึกกฎการเช่า"}
              </button>
              <button onClick={() => { setEditing(false); setDraft(property?.rules || ""); }} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.inkSoft }}>
                ยกเลิก
              </button>
            </div>
          </>
        ) : (
          <>
            {property?.rules ? (
              <p className="text-sm whitespace-pre-wrap" style={{ color: C.ink, lineHeight: 1.7 }}>{property.rules}</p>
            ) : (
              <p className="text-sm" style={{ color: C.inkSoft }}>{isLandlord ? "ยังไม่ได้ตั้งกฎการเช่า กดปุ่มด้านล่างเพื่อเพิ่ม" : "เจ้าของบ้านยังไม่ได้ตั้งกฎการเช่า"}</p>
            )}
            {isLandlord && (
              <button onClick={() => setEditing(true)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: C.navy }}>
                <Pencil size={14} /> {property?.rules ? "แก้ไขกฎการเช่า" : "เพิ่มกฎการเช่า"}
              </button>
            )}
          </>
        )}
        {msg && !editing && <p className="text-xs mt-3" style={{ color: C.success }}>{msg}</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(null);
  const [property, setProperty] = useState(null);
  const [rates, setRates] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [cyclesByRoom, setCyclesByRoom] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [view, setView] = useState("bills");

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
  const theme = getTheme(property);
  const themeKey = resolveThemeKey(property);

  return (
    <div className="min-h-screen w-full" style={{ background: C.paper, fontFamily: "'Inter', sans-serif" }}>
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 md:px-8 py-3 tfx-header" style={{ background: theme.headerBg }}>
        <ThemeFxStyle />
        <HeaderFx theme={theme} />
        <div className="flex items-center gap-2 text-white" style={{ position: "relative", zIndex: 2 }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.14)" }}>
            {property?.logo_url ? <img src={property.logo_url} alt="logo" className="w-full h-full object-cover" /> : <Home size={16} />}
          </div>
          <span className="font-semibold text-sm" style={display}>{theme.emoji ? `${theme.emoji} ` : ""}{property?.name}</span>
        </div>
        <div className="flex items-center gap-3" style={{ position: "relative", zIndex: 2 }}>
          <span className="text-xs text-white hidden sm:inline" style={{ opacity: 0.8 }}>{profile.full_name}</span>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full text-white" style={{ background: "rgba(255,255,255,0.14)" }}>
            <LogOut size={13} /> ออกจากระบบ
          </button>
        </div>
      </div>

      {theme && themeKey !== "default" && theme.fact && (
        <div className="px-5 md:px-8 py-2.5 text-xs flex items-start gap-2" style={{ background: C.card, borderBottom: `1px solid ${C.line}`, color: C.inkSoft, borderLeft: `3px solid ${theme.accent}` }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>💡</span>
          <span><b style={{ color: C.ink }}>รู้หรือไม่?</b> {theme.fact}</span>
        </div>
      )}

      <div className="flex justify-center gap-2 py-2" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
        <button onClick={() => setView("bills")} className="px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: view === "bills" ? theme.accent : C.paper, color: view === "bills" ? "#fff" : C.inkSoft }}>บิล</button>
        <button onClick={() => setView("shop")} className="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: view === "shop" ? theme.accent : C.paper, color: view === "shop" ? "#fff" : C.inkSoft }}><ShoppingCart size={13} /> ร้านค้า</button>
        {profile.role === "tenant" && (
          <button onClick={() => setView("profile")} className="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: view === "profile" ? theme.accent : C.paper, color: view === "profile" ? "#fff" : C.inkSoft }}><User size={13} /> โปรไฟล์</button>
        )}
        <button onClick={() => setView("rules")} className="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: view === "rules" ? theme.accent : C.paper, color: view === "rules" ? "#fff" : C.inkSoft }}><FileText size={13} /> กฎการเช่า</button>
      </div>

      {view === "bills" ? (
        profile.role === "landlord" ? (
          <LandlordView rooms={rooms} cyclesByRoom={cyclesByRoom} rates={rates} property={property} onRefresh={() => loadData(session.user.id)} />
        ) : (
          <TenantView room={myRoom} cycle={myCycle} rates={rates} property={property} onRefresh={() => loadData(session.user.id)} />
        )
      ) : view === "shop" ? (
        profile.role === "landlord" ? (
          <ShopLandlordView />
        ) : (
          <ShopTenantView room={myRoom} property={property} />
        )
      ) : view === "rules" ? (
        <RulesView property={property} role={profile.role} onRefresh={() => loadData(session.user.id)} />
      ) : (
        <ProfileTenantView profile={profile} onRefresh={() => loadData(session.user.id)} />
      )}
    </div>
  );
}
