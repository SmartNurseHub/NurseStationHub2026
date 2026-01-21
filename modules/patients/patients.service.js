/******************************************************************
 * modules/patients/patients.service.js
 *
 * PATIENTS SERVICE — FINAL CLEAN & SAFE
 *
 * หน้าที่:
 * - ติดต่อ Google Sheets
 * - Import / Upsert patients (CID-based)
 * - Search patients สำหรับ autocomplete
 *
 * เชื่อมโยง:
 * - patients.controller.js
 * - Google Sheets (PATIENTS MASTER)
 *
 * ถูกเรียกจาก:
 * - patients.controller.js (import / search)
 ******************************************************************/

const { google } = require("googleapis");

/* =========================================================
   GOOGLE AUTH & SHEETS CLIENT
========================================================= */
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(
    Buffer.from(
      process.env.GOOGLE_CREDENTIAL_BASE64,
      "base64"
    ).toString("utf8")
  ),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS;

/* =========================================================
   HELPERS / UTILITIES
========================================================= */

/**
 * Normalize CID → string 13 digits
 * - ป้องกัน Excel scientific notation
 * - ป้องกัน number / null / undefined
 */
function normalizeCID(cid) {
  if (cid === null || cid === undefined) return "";

  cid = String(cid);

  if (cid.includes("E") || cid.includes("e")) {
    cid = Number(cid).toFixed(0);
  }

  return cid
    .replace(/'/g, "")
    .replace(/\D/g, "")
    .padStart(13, "0");
}

/**
 * Safe lowercase
 * - ป้องกัน error: toLowerCase is not a function
 */
function safeLower(v) {
  return String(v ?? "").toLowerCase();
}

/* =========================================================
   IMPORT / UPSERT PATIENTS (CID-BASED)
========================================================= */
async function importPatientsService(rows) {
  /* ----------------------------------
     1) LOAD EXISTING CID FROM SHEET
  ---------------------------------- */
  const existingRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_PATIENTS}!A2:A`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const cidMap = {};
  (existingRes.data.values || []).forEach((r, i) => {
    const cid = normalizeCID(r[0]);
    if (cid) cidMap[cid] = i + 2; // sheet row
  });

  /* ----------------------------------
     2) DEDUP INPUT (CID UNIQUE)
  ---------------------------------- */
  const uniqueRows = {};
  for (const r of rows) {
    const cid = normalizeCID(r.CID);
    if (!cid) continue;
    uniqueRows[cid] = { ...r, CID: cid };
  }

  /* ----------------------------------
     3) PREPARE UPSERT DATA
  ---------------------------------- */
  const updates = [];
  const inserts = [];

  for (const cid of Object.keys(uniqueRows)) {
    const r = uniqueRows[cid];

    const rowValues = [
      `'${cid}`,           // A: CID (string)
      r.PRENAME ?? "",     // B
      r.NAME ?? "",        // C
      r.LNAME ?? "",       // D
      r.HN ?? "",          // E
      r.SEX ?? "",         // F
      r.BIRTH ?? "",       // G
      r.BIRTH_THAI ?? "",  // H
      r.TELEPHONE ?? "",   // I
      r.MOBILE ?? "",      // J
    ];

    if (cidMap[cid]) {
      updates.push({
        range: `${SHEET_PATIENTS}!A${cidMap[cid]}:J${cidMap[cid]}`,
        values: [rowValues],
      });
    } else {
      inserts.push(rowValues);
    }
  }

  /* ----------------------------------
     4) EXECUTE UPDATE
  ---------------------------------- */
  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });
  }

  /* ----------------------------------
     5) EXECUTE INSERT
  ---------------------------------- */
  if (inserts.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!A:J`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: inserts },
    });
  }

  /* ----------------------------------
     6) RESULT
  ---------------------------------- */
  return {
    updated: updates.length,
    inserted: inserts.length,
  };
}

/* =========================================================
   SEARCH PATIENTS
   - CID / HN / NAME / LNAME
   - ใช้กับ autocomplete
========================================================= */
async function searchPatients(keyword) {
  const q = safeLower(keyword);
  if (!q) return [];

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_PATIENTS}!A2:J`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = res.data.values || [];

  const mapped = rows.map(r => ({
    CID: normalizeCID(r[0]),
    PRENAME: r[1] ?? "",
    NAME: r[2] ?? "",
    LNAME: r[3] ?? "",
    HN: String(r[4] ?? ""),   // ⭐ บังคับเป็น string
    SEX: r[5] ?? "",
    BIRTH: r[6] ?? "",
    BIRTH_THAI: r[7] ?? "",
    TELEPHONE: r[9] ?? "",
    MOBILE: r[10] ?? "",
    
  }));

  return mapped
    .filter(r =>
      safeLower(r.CID).includes(q) ||
      safeLower(r.HN).includes(q) ||
      safeLower(r.NAME).includes(q) ||
      safeLower(r.LNAME).includes(q)
    )
    .slice(0, 10);
}

/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
  importPatientsService,
  searchPatients,
};
