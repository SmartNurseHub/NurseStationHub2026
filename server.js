/********************************************************************
 * SERVER.JS — PRODUCTION READY (NSR Sequencing + All APIs)
 ********************************************************************/
require("dotenv").config();
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const fs = require("fs");
const multer = require("multer");
const { google } = require("googleapis");

const app = express();

/********************************************************************
 * SECTION 1 — GLOBAL CONFIG
 ********************************************************************/
const PORT = process.env.PORT || 3000;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS || "Patients";
const SHEET_NURSING = process.env.SHEET_NURSING || "NursingRecords";
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });

// Google Credential Base64 → write temporary file
const tmpCredentialPath = path.join(__dirname, "config", "credentials.json");
if (process.env.GOOGLE_CREDENTIAL_BASE64) {
  fs.writeFileSync(
    tmpCredentialPath,
    Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64")
  );
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpCredentialPath;
}

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/********************************************************************
 * SECTION 2 — GOOGLE SHEETS HELPERS
 ********************************************************************/
async function readSheet(sheetName) {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName
  });

  const rows = resp.data.values || [];
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = r[i] || ""; });
    return obj;
  });
}

/********************************************************************
 * SECTION 3 — UTILS
 ********************************************************************/
function findHeaderIndex(headers = [], target) {
  let i = headers.findIndex(h => String(h).trim() === target);
  if (i !== -1) return i;
  const lower = headers.map(h => String(h).trim().toLowerCase());
  return lower.indexOf(target.toLowerCase());
}

/********************************************************************
 * SECTION 4 — NSR SEQUENCE
 ********************************************************************/
async function generateNextNSR_SAFE() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const ym = `${yyyy}${mm}`;
  const prefix = `NSR${ym}-`;

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "NSR_SEQUENCE!A:B"
  });

  const rows = resp.data.values || [];
  let rowIndex = -1;
  let lastSeq = 0;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === ym) {
      rowIndex = i + 1;
      lastSeq = parseInt(rows[i][1] || "0", 10);
      break;
    }
  }

  const nextSeq = lastSeq + 1;

  if (rowIndex > -1) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `NSR_SEQUENCE!B${rowIndex}`,
      valueInputOption: "RAW",
      resource: { values: [[nextSeq]] }
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "NSR_SEQUENCE!A:B",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: [[ym, nextSeq]] }
    });
  }

  return prefix + String(nextSeq).padStart(5, "0");
}

/********************************************************************
 * SECTION 5 — API ROUTES
 ********************************************************************/
const router = express.Router();

// GET new NSR
router.get("/new/nsr", async (req, res) => {
  try {
    const next = await generateNextNSR_SAFE();
    res.json({ success: true, next });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload patients CSV/Excel
router.post("/patients/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, message: "ไม่มีไฟล์" });
    const content = fs.readFileSync(req.file.path, "utf8");
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== "");
    fs.unlink(req.file.path, () => {});

    if (lines.length < 2) return res.json({ success: false, message: "ไฟล์ว่าง" });

    const headers = lines[0].split(/\||,/).map(h => h.trim());
    const seenCID = new Set();
    const newDataList = [];

    lines.slice(1).forEach(line => {
      const values = line.split(/\||,/);
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i] || "");
      if (!obj.CID) return;
      if (seenCID.has(obj.CID)) return;
      seenCID.add(obj.CID);
      newDataList.push(obj);
    });

    // update/append to Google Sheet
    const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!A1:AG`
    });

    const rows = resp.data.values || [];
    const header = rows[0];
    const cidIndex = header.findIndex(h => h === "CID");
    const cidMap = {};
    for (let i = 1; i < rows.length; i++) {
      const cid = rows[i][cidIndex] || "";
      if (cid) cidMap[cid] = i + 1;
    }

    const updateRequests = [];
    const appendRows = [];
    for (const newData of newDataList) {
      const row = header.map(h => newData[h] || "");
      if (cidMap[newData.CID]) {
        updateRequests.push({
          range: `${SHEET_PATIENTS}!A${cidMap[newData.CID]}`,
          values: [row]
        });
      } else appendRows.push(row);
    }

    if (updateRequests.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { valueInputOption: "RAW", data: updateRequests }
      });
    }
    if (appendRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PATIENTS}!A1`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values: appendRows }
      });
    }

    res.json({ success: true, totalRows: newDataList.length, newRows: appendRows.length, updatedRows: updateRequests.length });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

// GET all patients
router.get("/Patients", async (req, res) => {
  try {
    const data = await readSheet(SHEET_PATIENTS);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// GET all NursingRecords
router.get("/NursingRecords", async (req, res) => {
  try {
    const data = await readSheet(SHEET_NURSING);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// GET single NursingRecord by NSR
router.get("/NursingRecords/:nsr", async (req, res) => {
  try {
    const nsr = req.params.nsr;
    const records = await readSheet(SHEET_NURSING);
    const record = records.find(r => r.NSR === nsr);
    if (!record) return res.json({ success: false, message: "ไม่พบ NSR" });
    res.json({ success: true, data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST NursingRecords (add/edit)
router.post("/NursingRecords", async (req, res) => {
  try {
    const data = req.body || {};
    const mode = String(data._mode || "add").toLowerCase();
    const keyNSR = data._key || data.NSR;
    if (!keyNSR) return res.status(400).json({ success: false, message: "NSR missing" });

    const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: SHEET_NURSING });
    const rows = resp.data.values || [];
    if (!rows.length) throw new Error("NursingRecords empty");
    const header = rows[0];

    const newRow = header.map(h => data[h] || "");
    const nsrIndex = header.indexOf("NSR");

    if (mode === "edit") {
      const targetRow = rows.findIndex(r => r[nsrIndex] === keyNSR) + 1;
      if (targetRow < 1) return res.json({ success: false, message: "NSR not found" });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NURSING}!A${targetRow}`,
        valueInputOption: "RAW",
        resource: { values: [newRow] }
      });
      return res.json({ success: true, NSR: keyNSR });
    }

    // ADD mode
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NURSING}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: [newRow] }
    });
    res.json({ success: true, NSR: keyNSR });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/********************************************************************
 * SECTION 6 — USE ROUTER
 ********************************************************************/
app.use("/api/sheet", router);

/********************************************************************
 * SECTION 7 — SPA FALLBACK
 ********************************************************************/
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/********************************************************************
 * SECTION 8 — START SERVER
 ********************************************************************/
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
