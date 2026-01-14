/******************************************************************
 * scripts/initMeta.js
 *
 * - Initialize Patients META spreadsheet
 * - Create standard META keys used by system
 * - Safe to run multiple times
 ******************************************************************/

require("dotenv").config();
const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

/* ===================== CONFIG ===================== */

const META_SPREADSHEET_ID = process.env.SPREADSHEET_PATIENTS_META_ID;
const SHEET_NAME = "Sheet1";

if (!META_SPREADSHEET_ID) {
  throw new Error("❌ SPREADSHEET_PATIENTS_META_ID is missing in .env");
}

/* ===================== META STRUCT ===================== */

const META_VALUES = [
  ["currentShard", "1"],
  ["rowsPerShard", "200000"],
  ["totalPatients", "0"],
  ["lastSync", new Date().toISOString()]
];

/* ===================== MAIN ===================== */

async function run() {
  console.log("🚀 Initializing Patients META...");

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  console.log("👤 Auth as:", auth.email || "service-account");

  /* ---------- detect sheet name ---------- */
  const metaInfo = await sheets.spreadsheets.get({
    spreadsheetId: META_SPREADSHEET_ID
  });

  const sheetName =
    metaInfo.data.sheets?.[0]?.properties?.title || SHEET_NAME;

  console.log("📄 META sheet:", sheetName);

  /* ---------- clear existing ---------- */
  await sheets.spreadsheets.values.clear({
    spreadsheetId: META_SPREADSHEET_ID,
    range: `${sheetName}!A:B`
  });

  /* ---------- write META ---------- */
  await sheets.spreadsheets.values.update({
    spreadsheetId: META_SPREADSHEET_ID,
    range: `${sheetName}!A1:B${META_VALUES.length}`,
    valueInputOption: "RAW",
    requestBody: {
      values: META_VALUES
    }
  });

  console.log("✅ META initialized successfully");
  console.table(META_VALUES);
}

/* ===================== RUN ===================== */

run().catch(err => {
  console.error("❌ initMeta FAILED");
  console.error(err.message);
  process.exit(1);
});
