/******************************************************************
 * scripts/initPatientsHeader.js
 *
 * - เขียน HEADER ให้ Patients_DATA
 * - ปลอดภัย: ถ้ามี header แล้ว จะไม่เขียนซ้ำ
 * - ใช้ Service Account
 ******************************************************************/

require("dotenv").config();
const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

/* ===================== CONFIG ===================== */

const SPREADSHEET_ID = process.env.SPREADSHEET_PATIENTS_DATA_001_ID;
const SHEET_NAME = "Sheet1";

if (!SPREADSHEET_ID) {
  throw new Error("❌ SPREADSHEET_PATIENTS_DATA_ID is missing in .env");
}

const HEADERS = [
  "HOSPCODE","CID","PID","HID","PRENAME","NAME","LNAME","HN","SEX","BIRTH",
  "MSTATUS","OCCUPATION_OLD","OCCUPATION_NEW","RACE","NATION","RELIGION",
  "EDUCATION","FSTATUS","FATHER","MOTHER","COUPLE","VSTATUS","MOVEIN",
  "DISCHARGE","DDISCHARGE","ABOGROUP","RHGROUP","LABOR","PASSPORT",
  "TYPEAREA","D_UPDATE","TELEPHONE","MOBILE"
];

/* ===================== MAIN ===================== */

async function main() {
  console.log("🚀 Initializing Patients header...");

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  console.log("👤 Auth as:", auth.email || "service-account");

  /* ---------- read first row ---------- */
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:ZZ1`
  });

  const existing = (res.data.values && res.data.values[0]) || [];

  /* ---------- already initialized ---------- */
  if (existing.length && existing[0] === "HOSPCODE") {
    console.log("✅ Header already exists — skip writing");
    return;
  }

  /* ---------- write header ---------- */
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [HEADERS]
    }
  });

  console.log("✅ Header written successfully");
}

/* ===================== RUN ===================== */

main().catch(err => {
  console.error("❌ INIT HEADER FAILED");
  console.error(err.message);
  process.exit(1);
});
