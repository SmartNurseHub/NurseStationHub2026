/********************************************************************
 * routes/sheets.js — Render Production Safe + SSE Upload (PERSON)
 ********************************************************************/

const express = require("express");
const { google } = require("googleapis");
const multer = require("multer");

const router = express.Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

/* ===================== ENV ===================== */
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS || "Patients";
const SHEET_NURSING  = process.env.SHEET_NURSING  || "NursingRecords";

/* ===================== GOOGLE AUTH ===================== */
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64").toString("utf8")
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

/* ===================== HELPERS ===================== */
function colIndexToLetter(index) {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

async function readSheet(sheetName) {
  const sheets = await getSheets();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });

  const rows = resp.data.values || [];
  if (rows.length < 2) return [];

  const header = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/* ===================== BASIC ROUTES ===================== */

router.get("/patients", async (_, res) => {
  try {
    const data = await readSheet(SHEET_PATIENTS);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/nursing-records", async (_, res) => {
  try {
    const data = await readSheet(SHEET_NURSING);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
 * SSE UPLOAD PERSON (PIPE | DELIMITED)
 * ========================================================= */
router.post(
  "/patients/upload-sse",
  upload.single("file"),
  async (req, res) => {

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    /* ---------- SSE HEADER ---------- */
    res.writeHead(200, {
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    });

    try {
      const sheets = await getSheets();

      /* ---------- READ & CLEAN FILE ---------- */
      const content = req.file.buffer.toString("utf8");

      const lines = content
        .replace(/\t+/g, "")      // 🔥 ล้าง TAB
        .split(/\r?\n/)
        .filter(l => l.trim() !== "");

      if (lines.length < 2) {
        throw new Error("File has no data rows");
      }

      /* ---------- HEADER ---------- */
      const headers = lines[0]
        .replace(/^\uFEFF/, "")
        .split("|")
        .map(h => h.trim());

      const dataLines = lines.slice(1);
      const total = dataLines.length;

      /* ---------- CID SET ---------- */
      const KEY_NAME = "CID";
      const keyColIndex = headers.indexOf(KEY_NAME);
      if (keyColIndex === -1) throw new Error("CID column not found");

      const keyColLetter = colIndexToLetter(keyColIndex);

      /* ---------- LOAD EXISTING CID ---------- */
      const sheetResp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PATIENTS}!${keyColLetter}:${keyColLetter}`,
      });

      const existingSet = new Set(
        (sheetResp.data.values || []).slice(1).flat().filter(Boolean)
      );

      /* ---------- INSERT HEADER IF EMPTY ---------- */
      if (!sheetResp.data.values || sheetResp.data.values.length === 0) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: SHEET_PATIENTS,
          valueInputOption: "RAW",
          requestBody: { values: [headers] },
        });
      }

      /* ---------- PARSE ROWS ---------- */
      let processed = 0;
      let newRows = 0;
      let skipped = 0;
      const buffer = [];

      for (const line of dataLines) {
        const cols = line.split("|");
        const row = headers.map((_, i) => (cols[i] ?? "").trim());
        const cid = row[keyColIndex];

        processed++;

        if (!cid || cid.length !== 13 || existingSet.has(cid)) {
          skipped++;
        } else {
          buffer.push(row);
          existingSet.add(cid);
          newRows++;
        }

        // batch append
        if (buffer.length === 500) {
          await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_PATIENTS,
            valueInputOption: "RAW",
            requestBody: { values: buffer },
          });
          buffer.length = 0;
        }

        // SSE progress
        if (processed % 100 === 0 || processed === total) {
          res.write(
            `data: ${JSON.stringify({
              processed,
              total,
              newRows,
              skipped,
            })}\n\n`
          );
        }
      }

      /* ---------- FINAL FLUSH ---------- */
      if (buffer.length) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: SHEET_PATIENTS,
          valueInputOption: "RAW",
          requestBody: { values: buffer },
        });
      }

      res.write("event: done\ndata: {}\n\n");
      res.end();

    } catch (err) {
      console.error("SSE upload error:", err);
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`
      );
      res.end();
    }
  }
);

/* ===================== COUNT ===================== */
router.get("/patients/count", async (_, res) => {
  try {
    const sheets = await getSheets();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!A:A`,
    });
    res.json({ totalRows: resp.data.values?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
