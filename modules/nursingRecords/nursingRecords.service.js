/******************************************************************
 * modules/nursingRecords/nursingRecords.service.js
 * FINAL STANDARD VERSION (HARDENED)
 * - Single source of truth (column order)
 * - Normalize payload (กัน field เพี้ยน)
 * - Column safe (ไม่มีเลื่อน)
 * - Update merge ไม่ล้างข้อมูลเก่า
 ******************************************************************/
const { getSheets } = require("../../config/google");
/* ================= ENV ================= */
const SHEET_ID   = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NURSING;

/* =========================================================
   COLUMN ORDER (A → AJ)  *** SINGLE SOURCE OF TRUTH ***
========================================================= */
const NURSING_COLUMNS = [
  "NSR","Stamp","CID","HN","PRENAME","NAME","LNAME","TELEPHONE","BIRTH",
  "DateService","Activity","Objective","HealthInform","HealthAdvice",
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
   NORMALIZE (กัน field name เพี้ยนจาก frontend)
========================================================= */
function normalizeData(raw = {}) {
  return {
    ...raw,

    // ---- FOLLOW 1 ----
    Follow1Date:  raw.Follow1Date  || raw.DateFollow1  || "",
    Follow1Time:  raw.Follow1Time  || raw.TimeFollow1  || "",
    Follow1Route: raw.Follow1Route || raw.RouteFollow1 || "",

    // ---- FOLLOW 2 ----
    Follow2Date:  raw.Follow2Date  || raw.DateFollow2  || "",
    Follow2Time:  raw.Follow2Time  || raw.TimeFollow2  || "",
    Follow2Route: raw.Follow2Route || raw.RouteFollow2 || "",

    // ---- FOLLOW 3 ----
    Follow3Date:  raw.Follow3Date  || raw.DateFollow3  || "",
    Follow3Time:  raw.Follow3Time  || raw.TimeFollow3  || "",
    Follow3Route: raw.Follow3Route || raw.RouteFollow3 || "",
  };
}

/* =========================================================
   UTIL
========================================================= */
function rowArrayToObject(row = []) {
  const obj = {};
  NURSING_COLUMNS.forEach((col, i) => {
    obj[col] = row[i] || "";
  });
  return obj;
}

function objectToRowArray(data = {}, fallback = []) {
  return NURSING_COLUMNS.map((col, i) => {
    if (data[col] !== undefined && data[col] !== "") return data[col];
    return fallback[i] || "";
  });
}


function getLastColumnLetter() {
  const colCount = NURSING_COLUMNS.length;
  let letter = "";
  let temp = colCount;

  while (temp > 0) {
    let mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }

  return letter;
}

/* =========================================================
   GET ALL
========================================================= */
exports.getAll = async () => {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:${getLastColumnLetter()}`,
  });

  const rows = res.data.values || [];
  return rows.map(rowArrayToObject);
};

/* =========================================================
   SAVE (APPEND)
========================================================= */
exports.save = async rawData => {
  const sheets = await getSheets();
  const now = new Date().toISOString();

  const data = normalizeData(rawData);

  // 🔎 DEBUG (ถ้าจะเช็ค ให้เปิดบรรทัดนี้)
  // console.log("🧪 SAVE DATA", data);

  const row = NURSING_COLUMNS.map(col => {
    if (col === "Stamp")  return data.Stamp || now;
    if (col === "status") return "ACTIVE";
    if (col === "TELEPHONE" && data[col]) {
    return `'${data[col]}`; // บังคับเป็น text
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
   UPDATE BY NSR (SAFE MERGE)
========================================================= */
exports.updateByNSR = async (nsr, rawData) => {
  const sheets = await getSheets();

  const data = normalizeData(rawData);

  // หาแถวจาก NSR
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:A`,
  });

  const rows = res.data.values || [];
  const index = rows.findIndex(r =>
  String(r[0]).trim() === String(nsr).trim()
);
  if (index === -1) throw new Error(`NSR not found: ${nsr}`);

  const rowNumber = index + 2;

  // ดึงข้อมูลเดิมทั้งแถว
  const oldRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${rowNumber}:${getLastColumnLetter()}${rowNumber}`,
  });

  const oldRow = oldRes.data.values?.[0] || [];

  const mergedRow = objectToRowArray(
    { ...data, 
      NSR: nsr,
      TELEPHONE: data.TELEPHONE ? `'${data.TELEPHONE}` : undefined
     }, 
     oldRow
  );

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${rowNumber}:${getLastColumnLetter()}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [mergedRow] }
  });
};

/* =========================================================
   GET NEXT NSR
========================================================= */
exports.getNextNSR = async () => {
  const sheets = await getSheets();

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, "0");

  // prefix สำหรับแสดงผล (ยังมีเดือน)
  const prefix = `NSR${yyyy}${mm}`;

  // prefix สำหรับการนับ (เฉพาะปี)
  const yearPrefix = `NSR${yyyy}`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:${getLastColumnLetter()}`,
  });

  const rows = res.data.values || [];

  // 🔹 เปลี่ยนจาก sameMonth → sameYear
  const sameYear = rows
    .map(r => r[0])
    .filter(v => v && v.startsWith(yearPrefix));

  let nextNo = 1;
  if (sameYear.length) {
    const last = sameYear
      .map(v => parseInt(v.split("-")[1], 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a)[0];
    nextNo = last + 1;
  }

  return `${prefix}-${String(nextNo).padStart(5, "0")}`;
};


/* =========================================================
   SOFT DELETE
========================================================= 
exports.deleteByNSR = async (nsr) => {
  console.log("🧨 SERVICE deleteByNSR", nsr);
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:A`,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[0] === nsr);

  if (rowIndex === -1) {
    throw new Error("NSR not found");
  }

  const sheetInfo = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  const sheetId = sheetInfo.data.sheets.find(
    s => s.properties.title === SHEET_NAME
  ).properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex + 1, // +1 เพราะ A2
              endIndex: rowIndex + 2,
            },
          },
        },
      ],
    },
  });
};*/
exports.softDeleteByNSR = async (nsr, user) => {
  await exports.updateByNSR(nsr, {
    Deleted: "YES",
    DeletedBy: user,
    DeletedAt: new Date().toISOString(),
    status: "DELETED"
  });
};


exports.getByNSR = async (nsr) => {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:${getLastColumnLetter()}`,
  });

  const rows = res.data.values || [];

  const index = rows.findIndex(r =>
  String(r[0]).trim() === String(nsr).trim()
);

console.log("🔎 SEARCH NSR:", nsr);
console.log("🔎 FOUND INDEX:", index);

if (index === -1) {
  console.log("❌ NSR NOT FOUND IN SHEET");
  throw new Error(`NSR not found: ${nsr}`);
}

const found = rows[index];

return rowArrayToObject(found);
};
