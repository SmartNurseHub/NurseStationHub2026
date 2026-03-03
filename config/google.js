/******************************************************************
 * config/google.js  (FULL SYSTEM SAFE VERSION)
 ******************************************************************/
const { google } = require("googleapis");

let sheetsInstance = null;
let sheetIdCache = {};

/* ============================================================
   AUTH + SINGLETON SHEETS
============================================================ */
async function getSheets() {
  if (sheetsInstance) return sheetsInstance;

  if (!process.env.GOOGLE_CREDENTIAL_BASE64)
    throw new Error("❌ GOOGLE_CREDENTIAL_BASE64 missing");

  if (!process.env.SPREADSHEET_ID)
    throw new Error("❌ SPREADSHEET_ID missing");

  const credentials = JSON.parse(
    Buffer.from(
      process.env.GOOGLE_CREDENTIAL_BASE64.replace(/\s/g, ""),
      "base64"
    ).toString("utf8")
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsInstance = google.sheets({ version: "v4", auth });
  return sheetsInstance;
}

/* ============================================================
   READ ALL (รวม header ทุกคอลัมน์)
============================================================ */
async function readRows(sheetName) {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: sheetName, // ✅ อ่านทั้งหมด
  });

  return res.data.values || [];
}

/* ============================================================
   READ WITHOUT HEADER
============================================================ */
async function getSheetRows(sheetName) {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${sheetName}!A2:ZZ`, // ✅ รองรับ 702 columns
  });

  return res.data.values || [];
}

/* ============================================================
   APPEND
============================================================ */
async function appendRow(sheetName, values) {
  const sheets = await getSheets();

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: sheetName,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/* ============================================================
   FIND ROW BY CID (Column B)
============================================================ */
async function findRowByCID(sheetName, cid) {
  const rows = await readRows(sheetName);

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === cid) {
      return i + 1; // Google Sheet row index
    }
  }

  return null;
}

/* ============================================================
   UPDATE ROW (Dynamic Column Safe)
============================================================ */
async function updateRow(sheetName, rowNumber, values) {
  const sheets = await getSheets();

  const columnCount = values.length;

  // รองรับเกิน 26 columns
  const endColumn = getColumnLetter(columnCount);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}:${endColumn}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/* ============================================================
   DELETE ROW
============================================================ */
async function deleteRow(sheetName, rowNumber) {
  const sheets = await getSheets();

  let sheetId = sheetIdCache[sheetName];

  if (!sheetId) {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
    });

    const sheet = spreadsheet.data.sheets.find(
      s => s.properties.title === sheetName
    );

    if (!sheet) throw new Error("Sheet not found");

    sheetId = sheet.properties.sheetId;
    sheetIdCache[sheetName] = sheetId;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });
}

/* ============================================================
   UTILITY: COLUMN LETTER CONVERTER (รองรับ > Z)
============================================================ */
function getColumnLetter(col) {
  let letter = "";
  while (col > 0) {
    let temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}



module.exports = {
  getSheets,   // ✅ ต้องใส่ตัวนี้กลับ
  readRows,
  appendRow,
  updateRow,
  findRowByCID,
  getSheetRows,
  deleteRow,
};