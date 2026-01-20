/******************************************************************
 * modules/patients/patients.service.js
 * PATIENTS SERVICE — FINAL (UPSERT BY CID)
 ******************************************************************/

const { google } = require("googleapis");

/* =========================
   GOOGLE AUTH
========================= */
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

/* =========================
   NORMALIZE CID (13 DIGITS)
========================= */
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

/* =========================================================
   IMPORT / UPSERT PATIENTS
========================================================= */
async function importPatientsService(rows) {

  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheet = process.env.SHEET_PATIENTS;

  /* ----------------------------------
     1) LOAD EXISTING CID FROM SHEET
  ---------------------------------- */
  const existingRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheet}!A2:A`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const cidMap = {};
  (existingRes.data.values || []).forEach((r, i) => {
    const cid = normalizeCID(r[0]);
    if (cid) cidMap[cid] = i + 2;
  });

  /* ----------------------------------
     2) DEDUP INPUT (CRITICAL FIX)
  ---------------------------------- */
  const uniqueRows = {};
  for (const r of rows) {
    const cid = normalizeCID(r.CID);
    if (!cid) continue;
    uniqueRows[cid] = r; // ตัวหลังทับตัวแรก
  }

  /* ----------------------------------
     3) PREPARE UPSERT
  ---------------------------------- */
  const updates = [];
  const inserts = [];

  for (const cid of Object.keys(uniqueRows)) {
    const r = uniqueRows[cid];

    const rowValues = [
      `'${cid}`,          // A CID (string)
      r.PRENAME ?? "",
      r.NAME ?? "",
      r.LNAME ?? "",
      r.HN ?? "",
      r.SEX ?? "",
      r.BIRTH ?? "",
      r.BIRTH_THAI ?? "",
      r.TELEPHONE ?? "",
      r.MOBILE ?? ""
    ];

    if (cidMap[cid]) {
      const rowNum = cidMap[cid];
      updates.push({
        range: `${sheet}!A${rowNum}:J${rowNum}`,
        values: [rowValues]
      });
    } else {
      inserts.push(rowValues);
    }
  }

  /* ----------------------------------
     4) EXECUTE UPDATE
  ---------------------------------- */
  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates
      }
    });
  }

  /* ----------------------------------
     5) EXECUTE INSERT
  ---------------------------------- */
  if (inserts.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheet}!A:J`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: inserts }
    });
  }

  /* ----------------------------------
     6) RESULT (REPORT CORRECT)
  ---------------------------------- */
  return {
    updated: updates.length,
    inserted: inserts.length
  };
}

module.exports = { importPatientsService };
