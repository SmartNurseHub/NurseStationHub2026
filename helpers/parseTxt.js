// =======================================================
// parseTxt — PIPE (|) delimited text → array of objects
// (production-safe)
// =======================================================

module.exports = function parseTxt(text) {
  if (!text || typeof text !== "string") return [];

  // -------------------------------------------------------
  // 1) split lines + trim + remove empty
  // -------------------------------------------------------
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  // -------------------------------------------------------
  // 2) header (remove BOM)
  // -------------------------------------------------------
  const headers = lines[0]
    .replace(/^\uFEFF/, "")   // 🔥 ตัด BOM
    .split("|")
    .map(h => h.trim());

  const colCount = headers.length;

  // -------------------------------------------------------
  // 3) data rows
  // -------------------------------------------------------
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("|");
    const obj = {};

    for (let c = 0; c < colCount; c++) {
      obj[headers[c]] = (cols[c] ?? "").trim();
    }

    rows.push(obj);
  }

  return rows;
};
