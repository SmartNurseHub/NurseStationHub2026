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

// ดึงข้อมูลผู้ป่วยทั้งหมด
router.get("/patients", async (_, res) => {
  try {
    const data = await readSheet(SHEET_PATIENTS);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error /patients:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ดึงข้อมูล nursing records
router.get("/nursing-records", async (_, res) => {
  try {
    const data = await readSheet(SHEET_NURSING);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error /nursing-records:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ดึง nursing record ตาม NSR
router.get("/nursing-records/:nsr", async (req, res) => {
  try {
    const data = await readSheet(SHEET_NURSING);
    const record = data.find(r => r.NSR === req.params.nsr);
    res.json(record ? { success: true, data: record } : { success: false });
  } catch (err) {
    console.error("Error /nursing-records/:nsr", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================== Upload Patients =====================
router.post(
  "/patients/upload",
  upload.single("file"),
  uploadPatients // controller แยกสำหรับ logic upload
);

// ===================== Count Patients =====================
router.get("/patients/count", async (req, res) => {
  try {
    const sheets = await getSheets();
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!A:A`, // เช็คแถวจากคอลัมน์แรก
    });

    const totalRows = sheetData.data.values?.length || 0;
    console.log("Total rows in Sheet:", totalRows);
    res.json({ totalRows });
  } catch (err) {
    console.error("Error in /patients/count:", err);
    res.status(500).json({ error: "Failed to get totalRows" });
  }
});

// ===================== Update nursing record =====================
router.put("/nursing-records/:nsr", async (req, res) => {
  // โค้ด update ของคุณใช้ต่อได้เหมือนเดิม
  res.json({ success: true, message: "Update route placeholder" });
});

module.exports = router;
