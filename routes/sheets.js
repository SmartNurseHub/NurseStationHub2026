/********************************************************************
 * routes/sheets.js — Render Production Safe
 * Google Sheets API (Read / Update)
 ********************************************************************/

const express = require("express");
const { google } = require("googleapis");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // memory only
const { uploadPatients } = require("../controllers/upload.controller");
/* ===================== ENV VALIDATION ===================== */
const REQUIRED_ENVS = [
  "SPREADSHEET_ID",
  "GOOGLE_CREDENTIAL_BASE64"
];

for (const key of REQUIRED_ENVS) {
  if (!process.env[key]) {
    throw new Error(`Missing ENV: ${key}`);
  }
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS || "Patients";
const SHEET_NURSING = process.env.SHEET_NURSING || "NursingRecords";

/* ===================== GOOGLE AUTH ===================== */
let auth;
try {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64").toString()
  );

  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
} catch (err) {
  throw new Error("Invalid GOOGLE_CREDENTIAL_BASE64");
}

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

/* ===================== HELPERS ===================== */
async function readSheet(sheetName) {
  const sheets = await getSheets();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });

  const rows = resp.data.values || [];
  if (!rows.length) return [];

  const header = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}

/* ===================== ROUTES ===================== */

// GET /api/sheet/patients
router.get("/patients", async (_, res) => {
  try {
    res.json({ success: true, data: await readSheet(SHEET_PATIENTS) });
  } catch (err) {
    console.error("Patients error:", err.message);
    res.status(500).json({ success: false });
  }
});

// GET /api/sheet/nursing-records
router.get("/nursing-records", async (_, res) => {
  try {
    res.json({ success: true, data: await readSheet(SHEET_NURSING) });
  } catch (err) {
    console.error("Nursing list error:", err.message);
    res.status(500).json({ success: false });
  }
});

// GET /api/sheet/nursing-records/:nsr
router.get("/nursing-records/:nsr", async (req, res) => {
  try {
    const data = await readSheet(SHEET_NURSING);
    const record = data.find(r => r.NSR === req.params.nsr);
    res.json(record ? { success: true, data: record } : { success: false });
  } catch (err) {
    console.error("Nursing detail error:", err.message);
    res.status(500).json({ success: false });
  }
});

router.post("/patients/upload", upload.single("file"), uploadPatients);
// PUT /api/sheet/nursing-records/:nsr
router.put("/nursing-records/:nsr", async (req, res) => {
  try {
    const { nsr } = req.params;
    const form = req.body || {};

    const sheets = await getSheets();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NURSING,
    });

    const rows = resp.data.values || [];
    if (!rows.length) {
      return res.status(404).json({ success: false, error: "Sheet empty" });
    }

    const headers = rows[0];
    const nsrIndex = headers.indexOf("NSR");
    if (nsrIndex === -1) {
      return res.status(500).json({ success: false, error: "NSR column missing" });
    }

    const rowIndex = rows.findIndex(
      (r, i) => i > 0 && r[nsrIndex] === nsr
    );

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, error: "NSR not found" });
    }

    const updatedRow = headers.map(
      h => form[h] ?? rows[rowIndex][headers.indexOf(h)] ?? ""
    );

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NURSING}!A${rowIndex + 1}`,
      valueInputOption: "RAW",
      resource: { values: [updatedRow] },
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Update NursingRecord error:", err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
