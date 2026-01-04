/********************************************************************
 * server.js — Render Production Safe
 * Node.js + Express + Google Sheets (ENV Credential)
 ********************************************************************/

require("dotenv").config();
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===================== ENV VALIDATION ===================== */
const REQUIRED_ENVS = [
  "SPREADSHEET_ID",
  "GOOGLE_CREDENTIAL_BASE64"
];

for (const key of REQUIRED_ENVS) {
  if (!process.env[key]) {
    console.error(`❌ Missing ENV: ${key}`);
    process.exit(1);
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
  console.error("❌ Invalid GOOGLE_CREDENTIAL_BASE64");
  process.exit(1);
}

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

/* ===================== MIDDLEWARE ===================== */
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

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


/* ===================== HEALTH CHECK ===================== */
app.get("/health", (_, res) => res.json({ ok: true }));

/* ===================== SPA FALLBACK ===================== */
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API not found" });
  }

  if (req.path.includes(".")) {
    return res.status(404).end();
  }

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const sheetsRouter = require("./routes/sheets");
app.use("/api/sheet", sheetsRouter);

/* ===================== ERROR HANDLER ===================== */
app.use((err, req, res, _next) => {
  console.error("🔥 API ERROR:", err.message);
  res.status(500).json({ success: false, error: "Internal Server Error" });
});

/* ===================== START ===================== */
app.listen(PORT, () => {
  console.log(`🚀 Render service running on port ${PORT}`);
});
