/********************************************************************
 * routes/sheets.js — Render Production Safe + SSE Upload
 ********************************************************************/

const express = require("express");
const { google } = require("googleapis");
const multer = require("multer");
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB
const router = express.Router();

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

/* ===================== SSE Upload Patients ===================== */
const BATCH_SIZE = 1000; // batch append

router.post("/patients/upload-sse", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  // ตั้งค่า SSE
  res.writeHead(200, {
  Connection: "keep-alive",
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no", // ⭐ กัน Render / proxy buffer
});


  try {
    const sheets = await getSheets();
    const content = req.file.buffer.toString("utf-8");
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    const total = lines.length;
    let newRows = 0;
    let updatedRows = 0;

    // โหลดข้อมูลเดิม
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!A:A`,
    });
    const existingRows = sheetData.data.values?.flat() || [];

    const toAppend = [];
    lines.forEach(line => {
      if (!existingRows.includes(line)) {
        toAppend.push([line]);
        newRows++;
      } else {
        updatedRows++;
      }
    });

    for (let i = 0; i < toAppend.length; i += BATCH_SIZE) {
      const batch = toAppend.slice(i, i + BATCH_SIZE);
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_PATIENTS,
        valueInputOption: "RAW",
        resource: { values: batch },
      });
      await new Promise(r => setTimeout(r, 120));

      const processed = Math.min(i + batch.length, toAppend.length);
      res.write(`data: ${JSON.stringify({
        processed,
        total,
        newRows,
        updatedRows,
      })}\n\n`);
    }

    // ปิด SSE
    res.write("event: done\ndata: {}\n\n");
    res.end();
    console.log("Upload SSE completed successfully");

  } catch (err) {
  console.error("SSE upload exception:", err);

  res.write(`event: error\ndata: ${JSON.stringify({
    success: false,
    message: err.message
  })}\n\n`);

  res.end();
}

});

/* ===================== Count Patients ===================== */
router.get("/patients/count", async (req, res) => {
  try {
    const sheets = await getSheets();
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!A:A`,
    });
    const totalRows = sheetData.data.values?.length || 0;
    res.json({ totalRows });
  } catch (err) {
    console.error("Error in /patients/count:", err);
    res.status(500).json({ error: "Failed to get totalRows" });
  }
});

/**
 * POST /api/sheet/patients/upload-temp
 */
router.post("/patients/upload-temp", async (req, res) => {
  try {
    const rows = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
  return res.status(400).json({ error: "Empty or invalid payload" });
}


    res.json({
      success: true,
      received: rows.length
    });
  } catch (err) {
    console.error("upload-temp error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
