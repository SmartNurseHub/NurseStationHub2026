/********************************************************************
 * routes/sheets.js — Render Production Safe
 ********************************************************************/

const express = require("express");
const { google } = require("googleapis");
const multer = require("multer");
const upload = multer();
const router = express.Router();

const { uploadPatients } = require("../controllers/upload.controller");

/* ===================== ENV ===================== */
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS || "Patients";
const SHEET_NURSING = process.env.SHEET_NURSING || "NursingRecords";

/* ===================== GOOGLE AUTH ===================== */
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64").toString()
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
async function readSheet(sheetName) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });

  const rows = res.data.values || [];
  if (!rows.length) return [];

  const header = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/* ===================== ROUTES ===================== */
router.get("/patients", async (_, res) => {
  res.json({ success: true, data: await readSheet(SHEET_PATIENTS) });
});

router.get("/nursing-records", async (_, res) => {
  res.json({ success: true, data: await readSheet(SHEET_NURSING) });
});

router.get("/nursing-records/:nsr", async (req, res) => {
  const data = await readSheet(SHEET_NURSING);
  const record = data.find(r => r.NSR === req.params.nsr);
  res.json(record ? { success: true, data: record } : { success: false });
});

router.post(
  "/patients/upload",
  upload.single("file"),
  uploadPatients
);

router.put("/nursing-records/:nsr", async (req, res) => {
  // (โค้ด update ของคุณ ใช้ต่อได้เหมือนเดิม)
});

module.exports = router;
