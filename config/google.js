/******************************************************************
 * config/google.js (RE-ORGANIZED VERSION)
 *
 * แนวคิด:
 * - เป็นศูนย์กลางสำหรับเชื่อมต่อ Google Sheets API
 * - ใช้ Singleton pattern เพื่อลด overhead การ auth ซ้ำ
 * - รวม utility สำหรับ CRUD บน Google Sheets
 ******************************************************************/

const { google } = require("googleapis");


/*****************************************************************
 * MODULE: GLOBAL STATE / CACHE
 * หน้าที่:
 * - เก็บ instance ของ sheets (singleton)
 * - cache sheetId เพื่อลด API call ซ้ำ
 *****************************************************************/

let sheetsInstance = null;
let sheetIdCache = {};


/*****************************************************************
 * MODULE: AUTH + SHEETS INSTANCE (SINGLETON)
 * หน้าที่:
 * - สร้าง connection กับ Google Sheets API
 * - ใช้ environment variable สำหรับ credential
 * - คืน instance เดิมถ้ามีอยู่แล้ว
 *****************************************************************/

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


/*****************************************************************
 * MODULE: READ OPERATIONS
 * หน้าที่:
 * - อ่านข้อมูลจาก Google Sheets
 *****************************************************************/

/* ============================================================
   READ ALL (รวม header ทุกคอลัมน์)
============================================================ */
async function readRows(sheetName) {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: sheetName,
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
    range: `${sheetName}!A2:ZZ`,
  });

  return res.data.values || [];
}


/*****************************************************************
 * MODULE: WRITE OPERATIONS
 * หน้าที่:
 * - เพิ่ม / แก้ไข / ลบข้อมูลใน Google Sheets
 *****************************************************************/

/* ============================================================
   APPEND ROW
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
   UPDATE ROW (Dynamic Column Safe)
============================================================ */
async function updateRow(sheetName, rowNumber, values) {
  const sheets = await getSheets();

  const columnCount = values.length;
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


/*****************************************************************
 * MODULE: QUERY / SEARCH
 * หน้าที่:
 * - ค้นหาข้อมูลใน sheet
 *****************************************************************/

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


/*****************************************************************
 * MODULE: UTILITIES
 * หน้าที่:
 * - ฟังก์ชันช่วยเหลือทั่วไป
 *****************************************************************/

/* ============================================================
   COLUMN LETTER CONVERTER (รองรับ > Z)
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


/*****************************************************************
 * MODULE: METADATA
 * หน้าที่:
 * - ดึงข้อมูล metadata ของ spreadsheet
 *****************************************************************/

/* ============================================================
   GET ALL SHEET NAMES
============================================================ */
async function getSheetNames() {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
  });

  return res.data.sheets.map(s => s.properties.title);
}


/*****************************************************************
 * MODULE: EXPORT
 * หน้าที่:
 * - export function ให้ module อื่นใช้งาน
 *****************************************************************/

module.exports = {
  getSheets,
  readRows,
  appendRow,
  updateRow,
  findRowByCID,
  getSheetRows,
  deleteRow,
  getSheetNames
};