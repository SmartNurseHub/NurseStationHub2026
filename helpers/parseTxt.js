// =======================================================
// parseTxt — PIPE (|) delimited text → array of objects
// =======================================================

module.exports = function parseTxt(text) {
  if (!text) return [];

  // แยกบรรทัด + ตัดบรรทัดว่าง
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  // header (บรรทัดแรก)
  const headers = lines[0].split("|").map(h => h.trim());

  // data rows
  const rows = lines.slice(1).map(line => {
    const cols = line.split("|");
    const obj = {};

    headers.forEach((h, i) => {
      obj[h] = (cols[i] || "").trim();
    });

    return obj;
  });

  return rows;
};
