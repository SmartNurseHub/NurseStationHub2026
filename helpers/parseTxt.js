/******************************************************************
 * helpers/parseTxt.js
 * ROBUST HYBRID PARSER
 * - รองรับ buffer ทั้งไฟล์
 * - รองรับ parsing ทีละบรรทัด (streaming)
 * - RAM SAFE
 ******************************************************************/

"use strict";

/**
 * parseTxt(input)
 * @param {Buffer|string} input
 * @returns {Object}
 *  - buffer mode  → { headers: [], data: [][] }
 *  - stream mode  → { data: [[]] }   (1 row)
 */
module.exports = function parseTxt(input) {

  /* ================= STREAM MODE =================
     ใช้กับ readline / streaming
     input = string (1 line)
  ================================================= */
  if (typeof input === "string") {
    const line = input.trim();
    if (!line) return { data: [] };

    const delimiter = line.includes("|") ? "|" : ",";
    const row = line.split(delimiter).map(v => v.trim());

    return { data: [row] };
  }

  /* ================= BUFFER MODE =================
     ใช้กับไฟล์เล็ก / legacy
  ================================================= */
  if (!input || !Buffer.isBuffer(input)) {
    return { headers: [], data: [] };
  }

  const text = input.toString("utf8").trim();
  if (!text) return { headers: [], data: [] };

  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { headers: [], data: [] };
  }

  const delimiter = lines[0].includes("|") ? "|" : ",";

  const rows = lines.map(line =>
    line.split(delimiter).map(v => v.trim())
  );

  return {
    headers: rows[0] || [],
    data: rows.slice(1)
  };
};
