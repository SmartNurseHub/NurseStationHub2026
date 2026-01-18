/*************************************************
 * config/google.js
 * -----------------------------------------------
 * Google Sheets Configuration
 *
 * หน้าที่:
 * - init Google Auth (Service Account)
 * - สร้าง Google Sheets client
 *
 * ถูกเรียกจาก:
 * - services/upload.service.js
 * - services/patient.service.js
 *************************************************/

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
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

/* =========================
   GOOGLE SHEETS CLIENT
========================= */
const sheets = google.sheets({
  version: "v4",
  auth
});

/* =================================================
   LOW-LEVEL HELPER
   - รับ array เท่านั้น
   - ไม่ผูก business schema
================================================= */
async function appendRow(sheetName, row = []) {
  if (!sheetName || !Array.isArray(row)) {
    throw new Error("Invalid appendRow arguments");
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: sheetName,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row]
    }
  });

  return true;
}

/* =========================
   EXPORT
========================= */
module.exports = {
  sheets,
  appendRow
};
