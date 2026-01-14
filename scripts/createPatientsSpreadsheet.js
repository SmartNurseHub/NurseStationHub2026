/******************************************************************
 * createPatientsSpreadsheet.js
 *
 * - Create Patients Spreadsheet
 * - Create Patients shard 0
 * - Write header
 * - Sync META (PATIENTS_SHARD_COUNT, ACTIVE_SHARD)
 ******************************************************************/

require("dotenv").config();
const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

/* ================= CONFIG ================= */
const META_ID = process.env.SPREADSHEET_META_ID;

const PATIENT_HEADERS = [
  "HOSPCODE","CID","PID","HID","PRENAME","NAME","LNAME","HN","SEX","BIRTH",
  "MSTATUS","OCCUPATION_OLD","OCCUPATION_NEW","RACE","NATION","RELIGION",
  "EDUCATION","FSTATUS","FATHER","MOTHER","COUPLE","VSTATUS","MOVEIN",
  "DISCHARGE","DDISCHARGE","ABOGROUP","RHGROUP","LABOR","PASSPORT",
  "TYPEAREA","D_UPDATE","TELEPHONE","MOBILE"
];

/* ================= MAIN ================= */
async function main() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  /* ---------- create spreadsheet ---------- */
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: "Patients_Data"
      },
      sheets: [
        {
          properties: {
            title: "Patients",
            gridProperties: {
              rowCount: 200000,
              columnCount: PATIENT_HEADERS.length
            }
          }
        }
      ]
    }
  });

  const patientsSpreadsheetId = createRes.data.spreadsheetId;
  console.log("✅ Created Patients Spreadsheet:", patientsSpreadsheetId);

  /* ---------- write header ---------- */
  await sheets.spreadsheets.values.update({
    spreadsheetId: patientsSpreadsheetId,
    range: "Patients!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [PATIENT_HEADERS]
    }
  });

  console.log("✅ Header written to Patients sheet");

  /* ---------- sync META ---------- */
  const metaUpdates = [
    ["PATIENTS_SPREADSHEET_ID", patientsSpreadsheetId],
    ["PATIENTS_SHARD_COUNT", "1"],
    ["PATIENTS_ACTIVE_SHARD", "Patients"],
    ["PATIENTS_MAX_ROWS_PER_SHARD", "200000"]
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: META_ID,
    range: "META!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: metaUpdates
    }
  });

  console.log("✅ META synced");

  console.log("\n🎉 DONE");
  console.log("➡️ Copy this to .env:");
  console.log(`SPREADSHEET_PATIENTS_ID=${patientsSpreadsheetId}`);
}

/* ================= RUN ================= */
main().catch(err => {
  console.error("❌ FAILED:", err.message);
  process.exit(1);
});
