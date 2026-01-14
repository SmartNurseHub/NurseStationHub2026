/******************************************************************
 * helpers/parseTxt.js
 * Robust TXT / CSV parser
 ******************************************************************/

module.exports = function parseTxt(buffer) {
  if (!buffer) return { headers: [], data: [] };

  const text = buffer.toString("utf8").trim();
  if (!text) return { headers: [], data: [] };

  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], data: [] };
  }

  // detect delimiter | or ,
  const delimiter = lines[0].includes("|") ? "|" : ",";

  const rows = lines.map(line =>
    line.split(delimiter).map(v => v.trim())
  );

  return {
    headers: rows[0] || [],
    data: rows.slice(1)
  };
};
