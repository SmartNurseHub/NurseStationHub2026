/********************************************************************
 * SERVER.JS — PRODUCTION READY (Render / Railway OK)
 ********************************************************************/
require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
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
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const upload = multer({ dest: UPLOAD_DIR });

/********************************************************************
 * SECTION 1.1 — GOOGLE CREDENTIAL (BASE64 → FILE)
 ********************************************************************/
const configDir = path.join(__dirname, "config");
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const credentialPath = path.join(configDir, "credentials.json");

if (process.env.GOOGLE_CREDENTIAL_BASE64) {
  fs.writeFileSync(
    credentialPath,
    Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64")
  );
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
} else {
  console.warn("⚠️ GOOGLE_CREDENTIAL_BASE64 not found");
}

/********************************************************************
 * SECTION 1.2 — MIDDLEWARE
 ********************************************************************/
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

/********************************************************************
 * SECTION 2 — GOOGLE SHEETS HELPER
 ********************************************************************/
async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

async function readSheet(sheetName) {
  const sheets = await getSheets();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });

  const rows = resp.data.values || [];
  if (rows.length === 0) return [];

  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = r[i] || ""));
    return obj;
  });
}

/********************************************************************
 * SECTION 3 — NSR SEQUENCE (SAFE)
 ********************************************************************/
async function generateNextNSR_SAFE() {
  const sheets = await getSheets();

  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `NSR${ym}-`;

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "NSR_SEQUENCE!A:B",
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
      resource: { values: [[nextSeq]] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "NSR_SEQUENCE!A:B",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: [[ym, nextSeq]] },
    });
  }

  return prefix + String(nextSeq).padStart(5, "0");
}

/********************************************************************
 * SECTION 4 — API ROUTES
 ********************************************************************/
const router = express.Router();

router.get("/new/nsr", async (req, res) => {
  try {
    const next = await generateNextNSR_SAFE();
    res.json({ success: true, next });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/Patients", async (req, res) => {
  try {
    res.json({ success: true, data: await readSheet(SHEET_PATIENTS) });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.get("/NursingRecords", async (req, res) => {
  try {
    res.json({ success: true, data: await readSheet(SHEET_NURSING) });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.get("/NursingRecords/:nsr", async (req, res) => {
  try {
    const data = await readSheet(SHEET_NURSING);
    const record = data.find((r) => r.NSR === req.params.nsr);
    if (!record) return res.json({ success: false, message: "ไม่พบ NSR" });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/********************************************************************
 * SECTION 5 — ROUTER + SPA
 ********************************************************************/
app.use("/api/sheet", router);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/********************************************************************
 * SECTION 6 — START SERVER
 ********************************************************************/
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
