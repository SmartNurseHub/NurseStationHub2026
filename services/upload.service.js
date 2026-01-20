/*************************************************
 * services/upload.service.js
 * -----------------------------------------------
 * Service Layer: Upload / Import Patients
 *
 * หน้าที่:
 * 1. แปลงไฟล์ TXT (HOS format) → raw rows
 * 2. Map column index → patient object
 * 3. Validate / filter patient data
 * 4. Append ข้อมูลลง Google Sheet
 *
 * ถูกเรียกจาก:
 * - controllers/upload.controller.js
 * - controllers/patients.controller.js
 *************************************************/

const { sheets } = require("../config/google");

/* =================================================
   SECTION 1: GOOGLE SHEET APPEND
   - รับ array ของ patient object
   - map → sheet row
================================================= */
async function appendToSheet(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }

  const values = rows.map(r => [
    `'${r.cid}`,                 // ป้องกัน CID หายเลข 0
    r.prename || "",
    r.fname || "",
    r.lname || "",
    r.hn || "",
    r.sex || "",
    r.birth || "",
    r.telephone || r.mobile || ""
  ]);

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: process.env.SHEET_PATIENTS,
      valueInputOption: "USER_ENTERED",
      requestBody: { values }
    });

    return values.length;
  } catch (err) {
    console.error("❌ appendToSheet error:", err);
    throw err;
  }
}

/* =================================================
   SECTION 2: PARSE TXT FILE
   - remove BOM
   - split line
   - return raw array (HOS format)
================================================= */
function parseTxt(rawText = "") {
  return rawText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.split("|"));
}

/* =================================================
   SECTION 3: MAP COLUMN → OBJECT
   ⚠️ ผูกกับโครงสร้างไฟล์ HOS (.txt)
================================================= */
function filterColumns(rows = []) {
  return rows.map(r => ({
    cid: r[1] || "",
    prename: r[4] || "",
    fname: r[5] || "",
    lname: r[6] || "",
    hn: r[7] || "",
    sex: r[8] || "",
    birth: r[9] || "",
    telephone: r[31] || "",
    mobile: r[32] || ""
  }));
}

/* =================================================
   SECTION 4: VALIDATE & FILTER
   - CID ต้องเป็นตัวเลข 13 หลัก
   - ตัด CID ปลอม
================================================= */
function filterRowsByCID(rows = []) {
  return rows.filter(r => {
    if (!r || !r.cid) return false;

    const cid = r.cid.trim();

    return (
      /^\d{13}$/.test(cid) &&
      cid !== "0000000000000"
    );
  });
}

/* =========================
   EXPORT
========================= */
module.exports = {
  parseTxt,
  filterColumns,
  filterRowsByCID,
  appendToSheet
};
