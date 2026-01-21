/******************************************************************
 * modules/nursingRecords/nursingRecords.service.js
 *
 * หน้าที่:
 *  - อ่าน / เขียน Google Sheet: NursingRecords
 *  - ดึงรายการ Nursing Records
 *  - สร้าง NSR No. อัตโนมัติ (NSRYYYYMM-00000)
 ******************************************************************/
const { google } = require("googleapis");
const { getAuth } = require("../../config/google");

/* ================= ENV ================= */
const SHEET_ID   = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NURSING;

/* =========================================================
   GET ALL NURSING RECORDS
========================================================= */
exports.getAll = async () => {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:Z`,
  });

  const rows = res.data.values || [];

  return rows.map(r => ({
    NSR:        r[0] || "",
    DateService:r[1] || "",
    CID:        r[2] || "",
    HN:         r[3] || "",
    NAME:       r[4] || "",
    LNAME:      r[5] || "",
    TELEPHONE:  r[6] || "",
    Activity:   r[7] || "",
    Provider1:  r[8] || "",
    Stamp:      r[9] || ""
  }));
};

/* =========================================================
   SAVE NURSING RECORD
========================================================= */
exports.save = async data => {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const row = [
  data.NSR || "",
  data.Stamp || new Date().toISOString(),
  data.CID || "",
  data.HN || "",
  data.NAME || "",
  data.LNAME || "",
  data.TELEPHONE || "",
  data.DateService || "",
  data.Activity || "",
  data.Objective || "",
  data.HealthInform || "",
  data.HealthAdvice || "",
  data.DateFollow1 || "",
  data.TimeFollow1 || "",
  data.RouteFollow1 || "",
  data.Provider1 || "",
  data.Response1 || "",
  data.DateFollow2 || "",
  data.TimeFollow2 || "",
  data.RouteFollow2 || "",
  data.Provider2 || "",
  data.Response2 || "",
  data.DateFollow3 || "",
  data.TimeFollow3 || "",
  data.RouteFollow3 || "",
  data.Provider3 || "",
  data.Response3 || "",
  
];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row]
    }
  });
};

/* =========================================================
   GET NEXT NSR NO.
   Format: NSRYYYYMM-00000
========================================================= */
exports.getNextNSR = async () => {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `NSR${yyyy}${mm}`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:A`,
  });

  const rows = res.data.values || [];

  const sameMonth = rows
    .map(r => r[0])
    .filter(v => v && v.startsWith(prefix));

  let nextNo = 1;

  if (sameMonth.length > 0) {
    const lastNo = sameMonth
      .map(v => parseInt(v.split("-")[1], 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a)[0];

    nextNo = lastNo + 1;
  }

  return `${prefix}-${String(nextNo).padStart(5, "0")}`;
};

/* =================================================
   BATCH SAVE PATIENTS
================================================= */
exports.batchSave = async rows => {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const values = rows.map(r => ([
    r.CID,
    r.HN || "",
    r.NAME || "",
    r.LNAME || "",
    r.BIRTH || "",
    r.TELEPHONE || ""
  ]));

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2`,
    valueInputOption: "RAW",
    requestBody: { values }
  });
};

