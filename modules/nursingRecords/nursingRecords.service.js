/******************************************************************
 * modules/nursingRecords/nursingRecords.service.js
 * PRODUCTION STABLE VERSION
 ******************************************************************/

const { getSheets } = require("../../config/google");

/* ================= ENV ================= */

const SHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NURSING;

/* =========================================================
   COLUMN ORDER (39 COLUMNS)
========================================================= */

const NURSING_COLUMNS = [
  "NSR","Stamp","CID","HN","PRENAME","NAME","LNAME","TELEPHONE","BIRTH",
  "DateService","Activity","Objective","HealthInform","HealthAdvice",
  "fileURL",

  "Follow1Date","Follow1Time","Follow1Route","Provider1","Response1",
  "Follow2Date","Follow2Time","Follow2Route","Provider2","Response2",
  "Follow3Date","Follow3Time","Follow3Route","Provider3","Response3",

  "Deleted","DeletedBy","DeletedAt","status","remark",

  "LineSent",
  "LineSentAt",
  "ResultConfirmed",
  "ConfirmedAt"
];

/* =========================================================
   NORMALIZE INPUT
========================================================= */

function normalizeData(raw = {}) {

  return {
    ...raw,

    Follow1Date: raw.Follow1Date || raw.DateFollow1 || "",
    Follow1Time: raw.Follow1Time || raw.TimeFollow1 || "",
    Follow1Route: raw.Follow1Route || raw.RouteFollow1 || "",

    Follow2Date: raw.Follow2Date || raw.DateFollow2 || "",
    Follow2Time: raw.Follow2Time || raw.TimeFollow2 || "",
    Follow2Route: raw.Follow2Route || raw.RouteFollow2 || "",

    Follow3Date: raw.Follow3Date || raw.DateFollow3 || "",
    Follow3Time: raw.Follow3Time || raw.TimeFollow3 || "",
    Follow3Route: raw.Follow3Route || raw.RouteFollow3 || ""

  };

}

/* =========================================================
   UTIL
========================================================= */

function padRow(row = []) {

  while (row.length < NURSING_COLUMNS.length) {
    row.push("");
  }

  return row;

}

function rowArrayToObject(row = []) {

  row = padRow(row);

  const obj = {};

  NURSING_COLUMNS.forEach((col, i) => {
    obj[col] = row[i] || "";
  });

  return obj;

}

/* =========================================================
   COLUMN NUMBER → LETTER
========================================================= */

function columnToLetter(column) {

  let temp;
  let letter = "";

  while (column > 0) {

    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;

  }

  return letter;

}

function getLastColumnLetter() {
  return columnToLetter(NURSING_COLUMNS.length);
}

/* =========================================================
   GET ALL
========================================================= */

exports.getAll = async () => {

  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:${getLastColumnLetter()}`
  });

  const rows = res.data.values || [];

  return rows.map(rowArrayToObject);

};

/* =========================================================
   SAVE NEW RECORD
========================================================= */

exports.save = async rawData => {

  const sheets = await getSheets();

  const now = new Date().toISOString();
  const data = normalizeData(rawData);

  const row = NURSING_COLUMNS.map(col => {

    if (col === "Stamp") return data.Stamp || now;

    if (col === "status") return "ACTIVE";

    if (col === "TELEPHONE" && data[col]) {
      return `'${data[col]}`;
    }

    return data[col] || "";

  });

  await sheets.spreadsheets.values.append({

    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] }

  });

};

/* =========================================================
   UPDATE BY NSR
========================================================= */
exports.updateByNSR = async (nsr, data) => {

  console.log("Updating NSR:", nsr);

  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:${getLastColumnLetter()}`
  });

  const rows = res.data.values || [];

  const index = rows.findIndex(r =>
    r && String(r[0]).trim() === String(nsr).trim()
  );

  console.log("Row index:", index);

  if (index === -1) {
    throw new Error(`NSR not found: ${nsr}`);
  }

  const rowNumber = index + 2;

  const updates = [];

  for (const key of Object.keys(data)) {

    const colIndex = NURSING_COLUMNS.indexOf(key);

    if (colIndex === -1) continue;

    const colLetter = columnToLetter(colIndex + 1);

    updates.push({
      range: `${SHEET_NAME}!${colLetter}${rowNumber}`,
      values: [[data[key]]]
    });

  }

  if (updates.length === 0) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates
    }
  });

};
/* =========================================================
   MARK LINE SENT
========================================================= */

exports.markLineSent = async (nsr) => {

  await exports.updateByNSR(nsr, {

    LineSent: "YES",
    LineSentAt: new Date().toISOString()

  });

};

/* =========================================================
   GET BY NSR
========================================================= */

exports.getByNSR = async (nsr) => {

  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:${getLastColumnLetter()}`
  });

  const rows = res.data.values || [];

  const index = rows.findIndex(r =>
    String(r[0]).trim() === String(nsr).trim()
  );

  if (index === -1) {
    throw new Error(`NSR not found: ${nsr}`);
  }

  return rowArrayToObject(rows[index]);

};

/* =========================================================
   SOFT DELETE
========================================================= */

exports.softDeleteByNSR = async (nsr, user) => {

  await exports.updateByNSR(nsr, {

    Deleted: "YES",
    DeletedBy: user,
    DeletedAt: new Date().toISOString(),
    status: "DELETED"

  });

};

/* =========================================================
   MARK RESULT CONFIRMED
========================================================= */

exports.markResultConfirmed = async (nsr) => {

  const record = await exports.getByNSR(nsr);

  if (!record) {
    console.log("NSR not found:", nsr);
    return;
  }

  if (record.ResultConfirmed === "YES") {
    console.log("Already confirmed:", nsr);
    return;
  }

  await exports.updateByNSR(nsr, {

    ResultConfirmed: "YES",
    ConfirmedAt: new Date().toISOString()

  });

  console.log("✅ Result confirmed:", nsr);

};