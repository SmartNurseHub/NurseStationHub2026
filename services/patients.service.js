/**
 * services/patients.service.js
 *
 * หน้าที่:
 * - รับข้อมูลผู้ป่วยจาก frontend (JSON array)
 * - map field → column ของ Google Sheet
 * - append ข้อมูลลง Google Sheet
 * - return จำนวนแถวที่บันทึกสำเร็จ
 */

const { google } = require("googleapis");

/* =========================
   GOOGLE AUTH SETUP
========================= */
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(
    Buffer.from(
      process.env.GOOGLE_CREDENTIAL_BASE64,
      "base64"
    ).toString()
  ),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({
  version: "v4",
  auth
});

/* =========================
   CORE SERVICE FUNCTION
========================= */
async function importPatients(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }

  /**
   * Sheet column order:
   * CID | PRENAME | NAME | LNAME | HN | SEX | BIRTH | TELEPHONE | MOBILE
   */
  const values = rows.map(r => [
    r.CID ? `'${r.CID}` : "",
    r.PRENAME || "",
    r.NAME || "",
    r.LNAME || "",
    r.HN || "",
    r.SEX || "",
    r.BIRTH || "",
    r.TELEPHONE || "",
    r.MOBILE || ""
  ]);

  console.log("🧪 append patients sample:", values[0]);
  console.log("🧪 append patients rows:", values.length);

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: process.env.SHEET_PATIENTS,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values
    }
  });

  console.log("✅ patients.service append success");

  return values.length;
}

module.exports = {
  importPatients
};
