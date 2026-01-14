/******************************************************************
 * scripts/initIndex.js
 * Rebuild Patients INDEX from Patients_DATA
 * - Auto-detect sheet names
 * - Safe range
 * - Production ready
 ******************************************************************/

require("dotenv").config();
const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

/* ===================== CONFIG ===================== */

const DATA_SPREADSHEET_ID  = process.env.SPREADSHEET_PATIENTS_DATA_ID;
const INDEX_SPREADSHEET_ID = process.env.SPREADSHEET_PATIENTS_INDEX_ID;

const SHARD_ID = "DATA_001"; // ✅ logical shard id
const CID_COL  = "CID";

if (!DATA_SPREADSHEET_ID) {
  throw new Error("❌ SPREADSHEET_PATIENTS_DATA_ID is missing in .env");
}
if (!INDEX_SPREADSHEET_ID) {
  throw new Error("❌ SPREADSHEET_PATIENTS_INDEX_ID is missing in .env");
}

/* ===================== MAIN ===================== */

async function run() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  console.log("🚀 Rebuilding Patients INDEX...");
  console.log("📌 DATA ID :", DATA_SPREADSHEET_ID);
  console.log("📌 INDEX ID:", INDEX_SPREADSHEET_ID);

  /* =====================================================
     1) Detect DATA sheet
  ===================================================== */
  const dataMeta = await sheets.spreadsheets.get({
    spreadsheetId: DATA_SPREADSHEET_ID
  });

  const dataSheetName = dataMeta.data.sheets[0].properties.title;
  console.log("📄 DATA sheet:", dataSheetName);

  /* =====================================================
     2) Read DATA (SAFE RANGE)
  ===================================================== */
  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId: DATA_SPREADSHEET_ID,
    range: `${dataSheetName}!A1:ZZ`
  });

  const rows = dataRes.data.values || [];
  if (rows.length < 2) {
    console.log("⚠️ No patient data found");
    return;
  }

  const headers = rows[0];
  const cidIndex = headers.indexOf(CID_COL);
  if (cidIndex === -1) {
    throw new Error("❌ CID column not found in Patients_DATA");
  }

  /* =====================================================
     3) Build INDEX rows
  ===================================================== */
  const indexRows = [];

  rows.slice(1).forEach((r, i) => {
    const cid = r[cidIndex];
    if (cid) {
      indexRows.push([
        cid,
        SHARD_ID,
        i + 2 // row number in sheet
      ]);
    }
  });

  console.log(`📦 Found ${indexRows.length} patient(s)`);

  /* =====================================================
     4) Detect INDEX sheet
  ===================================================== */
  const indexMeta = await sheets.spreadsheets.get({
    spreadsheetId: INDEX_SPREADSHEET_ID
  });

  const indexSheetName = indexMeta.data.sheets[0].properties.title;
  console.log("📄 INDEX sheet:", indexSheetName);

  /* =====================================================
     5) Clear INDEX
  ===================================================== */
  await sheets.spreadsheets.values.clear({
    spreadsheetId: INDEX_SPREADSHEET_ID,
    range: `${indexSheetName}!A:Z`
  });

  /* =====================================================
     6) Write INDEX header
  ===================================================== */
  await sheets.spreadsheets.values.update({
    spreadsheetId: INDEX_SPREADSHEET_ID,
    range: `${indexSheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [["CID", "shardId", "row"]]
    }
  });

  /* =====================================================
     7) Append INDEX (chunked)
  ===================================================== */
  const CHUNK = 1000;

  for (let i = 0; i < indexRows.length; i += CHUNK) {
    const chunk = indexRows.slice(i, i + CHUNK);

    await sheets.spreadsheets.values.append({
      spreadsheetId: INDEX_SPREADSHEET_ID,
      range: `${indexSheetName}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: chunk }
    });

    console.log(
      `➡️ Indexed ${Math.min(i + CHUNK, indexRows.length)}/${indexRows.length}`
    );
  }

  console.log("✅ Index rebuild completed");
  console.log("📊 Total indexed records:", indexRows.length);
}

/* ===================== RUN ===================== */

run().catch(err => {
  console.error("❌ initIndex FAILED");
  console.error(err.message);
  process.exit(1);
});
