console.log("📅 date.utils.js LOADED");

/* =================================================
   NORMALIZE TO YYYY-MM-DD
================================================= */
function toRawDate(dateStr) {
  if (!dateStr) return "";

  const s = String(dateStr).trim();

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // yyyymmdd
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  }

  return "";
}

/* =================================================
   FULL THAI DATE
   2026-02-12 → 12 กุมภาพันธ์ 2569
================================================= */
function toDisplayThaiDate(raw) {
  const s = toRawDate(raw);
  if (!s) return "";

  const [y, m, d] = s.split("-").map(Number);

  if (m < 1 || m > 12) return "";

  const thaiMonths = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
    "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
    "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
  ];

  return `${d} ${thaiMonths[m - 1]} ${y + 543}`;
}

/* =================================================
   CALCULATE AGE (SAFE VERSION)
================================================= */
function calculateAge(rawDate) {
  const s = toRawDate(rawDate);
  if (!s) return "";

  const [y, m, d] = s.split("-").map(Number);
  const birth = new Date(y, m - 1, d);

  if (isNaN(birth.getTime())) return "";

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
     today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age < 0 ? "" : age;
}

/* =================================================
   SHORT THAI DATE
   2026-02-12 → 12 ก.พ. 2569
================================================= */
function toThaiShortDate(dateInput) {
  const s = toRawDate(dateInput);
  if (!s) return "";

  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12) return "";

  const thaiMonthsShort = [
    "ม.ค.","ก.พ.","มี.ค.","เม.ย.",
    "พ.ค.","มิ.ย.","ก.ค.","ส.ค.",
    "ก.ย.","ต.ค.","พ.ย.","ธ.ค."
  ];

  return `${d} ${thaiMonthsShort[m - 1]} ${y + 543}`;
}

/* =================================================
   EXPORT GLOBAL (SPA SAFE)
================================================= */
window.toRawDate = toRawDate;
window.toDisplayThaiDate = toDisplayThaiDate;
window.toThaiShortDate = toThaiShortDate;
window.calculateAge = calculateAge;