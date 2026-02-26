/******************************************************************
 * config/google.js  (PRODUCTION SAFE + FIXED)
 ******************************************************************/
const { google } = require("googleapis");

/* ============================================================
   AUTH
============================================================ */
function getAuth() {
  if (!process.env.GOOGLE_CREDENTIAL_BASE64) {
    throw new Error("❌ GOOGLE_CREDENTIAL_BASE64 is missing");
  }

  if (!process.env.SPREADSHEET_ID) {
    throw new Error("❌ SPREADSHEET_ID is missing");
  }

  const base64 = process.env.GOOGLE_CREDENTIAL_BASE64
    .replace(/\n/g, "")
    .replace(/\r/g, "");

  const credentials = JSON.parse(
    Buffer.from(base64, "base64").toString("utf8")
  );

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheets() {
  const auth = await getAuth();
  return google.sheets({ version: "v4", auth });
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
    requestBody: {
      values: [values],
    },
  });
}

/* ============================================================
   READ (อ่านทั้งหมดรวม header)
============================================================ */
async function readRows(sheetName) {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${sheetName}!A:I`,
  });

  const rows = res.data.values || [];

  return rows.map(row => {
    const newRow = [];
    for (let i = 0; i < 9; i++) {
      newRow[i] = row[i] || "";
    }
    return newRow;
  });
}

/* ============================================================
   READ WITHOUT HEADER (สำหรับ dropdown)
============================================================ */
async function getSheetRows(sheetName) {
  const sheets = await getSheets();   // ✅ ต้องสร้าง sheets ก่อน

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,  // ✅ ใช้ตัวเดียวกับไฟล์นี้
    range: `${sheetName}!A2:I`,
  });

  return res.data.values || [];
}

/* ============================================================
   FIND ROW BY CID (Column B)
============================================================ */
async function findRowByCID(sheetName, cid) {
  const rows = await readRows(sheetName);

  for (let i = 1; i < rows.length; i++) { // ข้าม header
    if (rows[i][1] === cid) {
      return i + 1; // Google Sheet row index (เริ่มที่ 1)
    }
  }

  return null;
}

/* ============================================================
   UPDATE FULL ROW
============================================================ */
async function updateRow(sheetName, rowNumber, values) {
  const sheets = await getSheets();

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}:I${rowNumber}`, // ✅ ครบ 9 คอลัมน์
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values],
    },
  });
}

/* ============================================================
   DELETE ROW BY ROW NUMBER
============================================================ */
async function deleteRow(sheetName, rowNumber) {
  const sheets = await getSheets();

  // ต้องรู้ sheetId (gid) ก่อน
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
  });

  const sheet = spreadsheet.data.sheets.find(
    s => s.properties.title === sheetName
  );

  if (!sheet) {
    throw new Error("Sheet not found");
  }

  const sheetId = sheet.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1, // index เริ่ม 0
              endIndex: rowNumber        // ลบ 1 แถว
            }
          }
        }
      ]
    }
  });
}

module.exports = {
  getAuth,        // ✅ เพิ่มตัวนี้กลับเข้าไป
  appendRow,
  readRows,
  findRowByCID,
  updateRow,
  getSheetRows,
  deleteRow
};