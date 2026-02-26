console.log("📅 date.utils.js LOADED");

function toRawDate(dateStr) {
  if (!dateStr) return "";
  const s = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{8}$/.test(s))
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;

  return "";
}

function toDisplayThaiDate(raw) {
  if (!raw) return "";

  const s = toRawDate(raw);
  if (!s) return "";

  const [y, m, d] = s.split("-").map(Number);
  const thaiMonths = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
    "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
    "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
  ];

  return `${d} ${thaiMonths[m-1]} ${y + 543}`;
}

function calculateAge(rawDate) {
  if (!rawDate) return "";

  const d = toRawDate(rawDate).replace(/-/g,"");
  const birth = new Date(d.slice(0,4), d.slice(4,6)-1, d.slice(6,8));
  if (isNaN(birth)) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
     today.getDate() < birth.getDate())
  ) age--;

  return age;
}

/* ===============================
   ISO → 12 ก.พ. 2569
================================ */
function toThaiShortDate(isoDate) {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  if (isNaN(date)) return "";

  const thaiMonthsShort = [
    "ม.ค.","ก.พ.","มี.ค.","เม.ย.",
    "พ.ค.","มิ.ย.","ก.ค.","ส.ค.",
    "ก.ย.","ต.ค.","พ.ย.","ธ.ค."
  ];

  const d = date.getDate();
  const m = thaiMonthsShort[date.getMonth()];
  const y = date.getFullYear() + 543;

  return `${d} ${m} ${y}`;
}

/* expose */
window.toThaiShortDate = toThaiShortDate;

/* 🔥 expose to global */
window.toRawDate = toRawDate;
window.toDisplayThaiDate = toDisplayThaiDate;
window.calculateAge = calculateAge;
