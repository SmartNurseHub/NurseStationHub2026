/*************************************************
 * config/google.js
 * -----------------------------------------------
 * หน้าที่:
 * - สร้าง Google Sheets client
 * - export ให้ service อื่นใช้งาน
 *************************************************/

const { google } = require("googleapis");

/* =================================================
   AUTH
================================================= */
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(
    Buffer.from(
      process.env.GOOGLE_CREDENTIAL_BASE64,
      "base64"
    ).toString("utf8")
  ),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

/* =================================================
   SHEETS CLIENT
================================================= */
const sheets = google.sheets({
  version: "v4",
  auth
});

/* =========================
   EXPORT
========================= */
module.exports = {
  sheets
};
