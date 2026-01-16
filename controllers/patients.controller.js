/******************************************************************
 * controllers/patients.controller.js
 * STREAM SAFE — NO readline.close() BUG
 ******************************************************************/
"use strict";

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");
const parseTxt = require("../helpers/parseTxt");

/* ================= CONFIG ================= */
const DATA_ID  = process.env.SPREADSHEET_PATIENTS_DATA_001_ID;
const INDEX_ID = process.env.SPREADSHEET_PATIENTS_INDEX_ID;

const SHEET = "Sheet1";
const DATA_START_ROW = 2;
const CID_COL = 1; // 0-based

/* =========================================================
   POST /api/patients/upload
========================================================= */
exports.uploadPatients = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    /* ---------- LOAD INDEX (กันซ้ำ) ---------- */
    const indexRes = await sheets.spreadsheets.values.get({
      spreadsheetId: INDEX_ID,
      range: `${SHEET}!A:A`
    });

    const cidSet = new Set(
      (indexRes.data.values || [])
        .slice(1)
        .map(r => String(r[0] || "").trim())
        .filter(Boolean)
    );

    /* ---------- STREAM FILE ---------- */
    const fileStream = fs.createReadStream(req.file.path);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let batch = [];
    let inserted = 0;
    let skipped = 0;
    let isHeader = true;

    for await (const line of rl) {
      const { data } = parseTxt(line);
      if (!data.length) continue;

      if (isHeader) {
        isHeader = false;
        continue;
      }

      const row = data[0];
      const cid = String(row[CID_COL] || "").trim();

      if (!cid || cidSet.has(cid)) {
        skipped++;
        continue;
      }

      cidSet.add(cid);
      batch.push(row);

      if (batch.length >= 500) {
        await appendBatch(sheets, batch);
        inserted += batch.length;
        batch = [];
      }
    }

    if (batch.length) {
      await appendBatch(sheets, batch);
      inserted += batch.length;
    }

    fs.unlink(req.file.path, () => {});

   return res.json({
  success: true,
  total: inserted + skipped,
  inserted,
  updated: 0,
  skipped
});


  } catch (err) {
    console.error("uploadPatients error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* =========================================================
   APPEND HELPER
========================================================= */
async function appendBatch(sheets, rows) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: DATA_ID,
    range: SHEET,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows }
  });
}
