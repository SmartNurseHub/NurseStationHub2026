/******************************************************************
 * controllers/patients.controller.js
 * SAFE VERSION — 100% NO DUPLICATE (CID BASED)
 ******************************************************************/

const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");
const parseTxt = require("../helpers/parseTxt");

/* ================= ENV ================= */
const DATA_ID  = process.env.SPREADSHEET_PATIENTS_DATA_001_ID;
const INDEX_ID = process.env.SPREADSHEET_PATIENTS_INDEX_ID;

const SHEET = "Sheet1";
const DATA_START_ROW = 2; // row 1 = header
const CID_COL = 1;        // CID column index (0-based)

/* =========================================================
   GET /api/patients  → โหลดตาราง
========================================================= */
exports.listPatients = async (req, res) => {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: DATA_ID,
      range: `${SHEET}!A:Z`,
    });

    const rows = result.data.values || [];
    if (rows.length === 0) return res.json([]);

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const data = dataRows.map(r => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] ?? "";
      });
      return obj;
    });

    res.json(data);
  } catch (err) {
    console.error("listPatients error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================
   POST /api/patients/upload
   CID-based UPSERT (NO DUPLICATE GUARANTEED)
========================================================= */
exports.uploadPatients = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file" });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    /* ================= PARSE FILE ================= */
    const parsed = parseTxt(req.file.buffer);
    const fileRows = parsed.data || [];

    if (!fileRows.length) {
      return res.json({ success: true, total: 0, inserted: 0, updated: 0 });
    }

    /* ================= LOAD DATA (SOURCE OF TRUTH) ================= */
    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId: DATA_ID,
      range: `${SHEET}!A:Z`,
    });

    const allRows = dataRes.data.values || [];
    if (allRows.length === 0) {
      return res.status(500).json({ error: "DATA sheet has no header" });
    }

    const header = allRows[0];
    const dataRows = allRows.slice(1);

    /* ================= BUILD CID MAP FROM DATA ================= */
    const dataCidMap = {};
    dataRows.forEach((r, i) => {
      const cid = r[CID_COL];
      if (cid && !dataCidMap[cid]) {
        dataCidMap[cid] = DATA_START_ROW + i; // real sheet row
      }
    });

    let inserted = 0;
    let updated = 0;

    const updates = [];
    const newRows = [];

    /* ================= UPSERT DECISION ================= */
    fileRows.forEach(row => {
      const cid = row[CID_COL];
      if (!cid) return;

      if (dataCidMap[cid]) {
        // UPDATE EXISTING
        updated++;
        updates.push({
          range: `${SHEET}!A${dataCidMap[cid]}`,
          values: [row],
        });
      } else {
        // INSERT NEW
        inserted++;
        newRows.push(row);
      }
    });

    /* ================= APPLY UPDATES ================= */
    for (const u of updates) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: DATA_ID,
        range: u.range,
        valueInputOption: "RAW",
        requestBody: { values: u.values },
      });
    }

    /* ================= APPEND NEW ROWS ================= */
    let startRow = null;

    if (newRows.length) {
      const appendRes = await sheets.spreadsheets.values.append({
        spreadsheetId: DATA_ID,
        range: `${SHEET}!A${DATA_START_ROW}`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: newRows },
      });

      startRow = Number(
        appendRes.data.updates.updatedRange.match(/\d+/)[0]
      );

      /* ================= WRITE INDEX (NO DUPLICATE) ================= */
      const indexRows = newRows.map((r, i) => [
        r[CID_COL],       // CID
        DATA_ID,
        startRow + i,
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId: INDEX_ID,
        range: `${SHEET}!A2`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: indexRows },
      });
    }

    res.json({
      success: true,
      total: fileRows.length,
      inserted,
      updated,
    });

  } catch (err) {
    console.error("uploadPatients error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
