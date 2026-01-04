// =======================================
// Parse TXT / CSV → Array<Object>
// =======================================

module.exports = function parseTxt(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const header = lines.shift().split(/,|\t/).map(h => h.trim());

  return lines.map(line => {
    const cols = line.split(/,|\t/);
    const obj = {};
    header.forEach((h, i) => obj[h] = cols[i] || "");
    return obj;
  });
};
