/******************************************************************
 * controllers/patients.controller.js
 * FINAL – Multi Spreadsheet + CID UPSERT + Reduced Columns
 ******************************************************************/
"use strict";

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

/* =========================================================
   CONFIG
========================================================= */

// Spreadsheet shards (001–010)
const DATA_SHEETS = Object.keys(process.env)
  .filter(k => k.startsWith("SPREADSHEET_PATIENTS_DATA_"))
  .sort()
  .map(k => process.env[k]);

const INDEX_ID = process.env.SPREADSHEET_PATIENTS_INDEX_ID;
const META_ID  = process.env.SPREADSHEET_PATIENTS_META_ID;

const SHEET_NAME = "Sheet1";
const ROWS_PER_SHARD = 10000;
const BATCH_SIZE = 500;

/* =========================================================
   COLUMN MAP (| delimited TXT)
   HOSPCODE|CID|PID|HID|PRENAME|NAME|LNAME|HN|SEX|BIRTH|...|TELEPHONE|MOBILE
========================================================= */
const COL_MAP = {
  CID: 2,
  PRENAME: 5,
  NAME: 6,
  LNAME: 7,
  HN: 8,
  SEX: 9,
  BIRTH: 10,
  TELEPHONE: 31
};

/* =========================================================
   REDUCE ROW (Sheet Columns A–H)
========================================================= */
function reduceRow(raw) {
  return [
    String(raw[COL_MAP.CID] || "").trim(), // A CID
    raw[COL_MAP.PRENAME] || "",            // B
    raw[COL_MAP.NAME] || "",               // C
    raw[COL_MAP.LNAME] || "",              // D
    raw[COL_MAP.HN] || "",                 // E
    raw[COL_MAP.SEX] || "",                // F
    raw[COL_MAP.BIRTH] || "",              // G
    raw[COL_MAP.TELEPHONE] || ""            // H
  ];
}

/* =========================================================
   HELPERS
========================================================= */
async function batchUpdateRows(sheets, spreadsheetId, updates) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: updates
    }
  });
}

/* =========================================================
   META
========================================================= */
async function loadMeta(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: META_ID,
    range: "Sheet1!A1:B10"
  });

  const meta = {};
  (res.data.values || []).forEach(([k, v]) => {
    meta[k] = isNaN(v) ? v : Number(v);
  });

  return {
    currentShard: meta.currentShard || 1,
    totalPatients: meta.totalPatients || 0
  };
}

async function saveMeta(sheets, meta) {
  const rows = [
    ["currentShard", meta.currentShard],
    ["rowsPerShard", ROWS_PER_SHARD],
    ["totalPatients", meta.totalPatients],
    ["lastSync", new Date().toISOString()]
  ];

  await sheets.spreadsheets.values.clear({
    spreadsheetId: META_ID,
    range: "Sheet1!A1:B10"
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: META_ID,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: { values: rows }
  });
}

/* =========================================================
   UPLOAD (UPSERT BY CID)
========================================================= */
exports.uploadPatients = async (req, res) => {
  if (!req.file?.path) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    /* ===== LOAD META ===== */
    const meta = await loadMeta(sheets);

    /* ===== LOAD INDEX ===== */
    const indexRes = await sheets.spreadsheets.values.get({
      spreadsheetId: INDEX_ID,
      range: "Sheet1!A2:C"
    });

    // CID => { spreadsheetId, row }
    const indexMap = new Map();
    (indexRes.data.values || []).forEach(r => {
      if (r[0] && r[1] && r[2]) {
        indexMap.set(String(r[0]), {
          spreadsheetId: r[1],
          row: Number(r[2])
        });
      }
    });

    /* ===== PREPARE ===== */
    const updates = [];
    const inserts = new Map();

    let shard = meta.currentShard;
    let shardRows = meta.totalPatients % ROWS_PER_SHARD;

    /* ===== READ FILE ===== */
    const rl = readline.createInterface({
      input: fs.createReadStream(req.file.path),
      crlfDelay: Infinity
    });

    let isHeader = true;
    let total = 0;

    for await (const line of rl) {
      const raw = line.split("|");
      if (!raw.length) continue;
      if (isHeader) { isHeader = false; continue; }

      const row = reduceRow(raw);
      const cid = row[0];
      if (!cid) continue;

      // ===== UPSERT =====
      if (indexMap.has(cid)) {
        const { spreadsheetId, row: rowNum } = indexMap.get(cid);
        updates.push({
          spreadsheetId,
          range: `${SHEET_NAME}!A${rowNum}:H${rowNum}`,
          values: [row]
        });
      } else {
        if (shardRows >= ROWS_PER_SHARD) {
          shard++;
          shardRows = 0;
        }

        const spreadsheetId = DATA_SHEETS[shard - 1];
        if (!spreadsheetId) {
          throw new Error("Shard limit exceeded");
        }

        shardRows++;
        const rowNum = shardRows + 1;

        if (!inserts.has(spreadsheetId)) inserts.set(spreadsheetId, []);
        inserts.get(spreadsheetId).push(row);

        indexMap.set(cid, { spreadsheetId, row: rowNum });

        meta.totalPatients++;
        meta.currentShard = shard;
      }

      total++;
    }

    /* ===== APPLY UPDATES ===== */
    const updateGroups = new Map();
    for (const u of updates) {
      if (!updateGroups.has(u.spreadsheetId)) {
        updateGroups.set(u.spreadsheetId, []);
      }
      updateGroups.get(u.spreadsheetId).push({
        range: u.range,
        values: u.values
      });
    }

    for (const [spreadsheetId, group] of updateGroups.entries()) {
      for (let i = 0; i < group.length; i += BATCH_SIZE) {
        await batchUpdateRows(
          sheets,
          spreadsheetId,
          group.slice(i, i + BATCH_SIZE)
        );
      }
    }

    /* ===== APPLY INSERTS ===== */
    for (const [spreadsheetId, rows] of inserts.entries()) {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${SHEET_NAME}!A:H`,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: rows.slice(i, i + BATCH_SIZE) }
        });
      }
    }

    /* ===== SAVE INDEX ===== */
    const indexRows = [];
    for (const [cid, v] of indexMap.entries()) {
      indexRows.push([cid, v.spreadsheetId, v.row]);
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: INDEX_ID,
      range: "Sheet1!A2:C"
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: INDEX_ID,
      range: "Sheet1!A2",
      valueInputOption: "RAW",
      requestBody: { values: indexRows }
    });

    /* ===== SAVE META ===== */
    await saveMeta(sheets, meta);

    fs.unlink(req.file.path, () => {});

    return res.json({
      success: true,
      total,
      updated: updates.length,
      inserted: total - updates.length
    });

  } catch (err) {
    console.error("uploadPatients error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
