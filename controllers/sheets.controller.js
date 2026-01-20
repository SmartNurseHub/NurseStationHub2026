/*************************************************
 * appendRow
 * -----------------------------------------------
 * Append ผู้ป่วย 1 ราย ลง Google Sheet
 *
 * ใช้เมื่อ:
 * - เพิ่มข้อมูลรายบุคคล
 * - ฟอร์มเพิ่มผู้ป่วยแบบ manual
 *
 * ถูกเรียกจาก:
 * - services/patient.service.js
 *************************************************/

async function appendRow(sheetName, row) {
  if (!row || !row.cid) {
    throw new Error("Invalid patient row");
  }

  const values = [[
    `'${row.cid}`,          // กัน CID หายเลข 0
    row.prename || "",
    row.fname || "",
    row.lname || "",
    row.birth || ""
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: sheetName,
    valueInputOption: "USER_ENTERED",
    requestBody: { values }
  });

  return true;
}
