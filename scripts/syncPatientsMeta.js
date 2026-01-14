/******************************************************************
 * syncPatientsMeta.js
 * Smart Nurse Hub 2026
 *
 * PURPOSE:
 * - Sync META spreadsheet after creating Patients Data spreadsheet
 * - Register shard info
 * - Initialize counters & limits
 *
 * REQUIRE:
 * .env must contain:
 *   SPREADSHEET_META_ID
 *   SPREADSHEET_PATIENTS_ID
 ******************************************************************/

const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

/* ======================================================
   CONFIG
====================================================== */

const META_ID = process.env.SPREADSHEET_META_ID;
const PATIENTS_ID = process.env.SPREADSHEET_PATIENTS_ID;

// META sheet name
const META_SHEET = "META";

// shard config
const BASE_SHEET = "Patients";
const MAX_ROWS_PER_SHEET = 200000;

/* ======================================================
   MAIN
====================================================== */
async function syncPatientsMeta() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  /* ---------- ensure META sheet ---------- */
  const metaInfo = await sheets.spreadsheets.get({
    spreadsheetId: META_ID
  });

  const sheetTitles = metaInfo.data.sheets.map(
    s => s.properties.title
  );

  if (!sheetTitles.includes(META_SHEET)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: META_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: META_SHEET }
            }
          }
        ]
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: META_ID,
      range: `${META_SHEET}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          "KEY",
          "VALUE",
          "UPDATED_AT"
        ]]
      }
    });

    console.log("✅ META sheet created");
  }

  /* ---------- write meta values ---------- */
  const now = new Date().toISOString();

  const metaRows = [
    ["PATIENTS_SPREADSHEET_ID", PATIENTS_ID, now],
    ["PATIENTS_BASE_SHEET", BASE_SHEET, now],
    ["PATIENTS_SHARD_COUNT", "1", now],
    ["PATIENTS_ACTIVE_SHARD", BASE_SHEET, now],
    ["PATIENTS_MAX_ROWS_PER_SHEET", String(MAX_ROWS_PER_SHEET), now]
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: META_ID,
    range: `${META_SHEET}!A2`,
    valueInputOption: "RAW",
    requestBody: {
      values: metaRows
    }
  });

  console.log("✅ META synced");
  console.log("\n📌 META VALUES:");
  metaRows.forEach(r => {
    console.log(`- ${r[0]} = ${r[1]}`);
  });

  console.log("\n🚀 DONE");
}

/* ======================================================
   RUN
====================================================== */
syncPatientsMeta().catch(err => {
  console.error("❌ ERROR:", err.message);
});
