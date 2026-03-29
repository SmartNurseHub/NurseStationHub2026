/*****************************************************************
 * dashboard.service.js (CLEAN & COMMENTED VERSION)
 *
 * แนวคิด:
 * - Business Logic Layer สำหรับหน้า Dashboard
 * - ติดต่อ Google Sheets
 * - จัดการข้อมูล Follow / Dashboard
 *****************************************************************/

const { google } = require("googleapis");
const { getAuth } = require("../../config/google");


/*****************************************************************
 * FUNCTION: getSheetsInstance
 * หน้าที่:
 * - สร้าง instance สำหรับเรียกใช้งาน Google Sheets API
 *****************************************************************/
async function getSheetsInstance() {
  const auth = await getAuth();
  return google.sheets({ version: "v4", auth });
}


/*****************************************************************
 * FUNCTION: getDashboardSummaryService
 * หน้าที่:
 * - คืนค่าภาพรวม dashboard (placeholder)
 * - Response: { patients, appointmentsToday, records, pending }
 *****************************************************************/
async function getDashboardSummaryService() {
  return {
    patients: 0,
    appointmentsToday: 0,
    records: 0,
    pending: 0
  };
}


/*****************************************************************
 * FUNCTION: getFollowListService
 * หน้าที่:
 * - ดึงรายการผู้ติดตามจาก Google Sheets
 * - Response: array ของ follower objects
 *****************************************************************/
async function getFollowListService() {
  const sheets = await getSheetsInstance();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_FOLLOW}!A2:F`
  });

  const rows = res.data.values || [];

  return rows
    .map(r => ({
      Timestamp: r[0] || "",
      EventType: r[1] || "",
      UserId: r[2] || "",
      DisplayName: r[3] || "",
      PictureUrl: r[4] || ""
    }))
    .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
}


/*****************************************************************
 * FUNCTION: addFollowerService
 * หน้าที่:
 * - เพิ่ม follower ใหม่
 * - ตรวจสอบ duplicate (CID / UserId)
 *****************************************************************/
async function addFollowerService(data) {
  const sheets = await getSheetsInstance();
  const existing = await getFollowListService();

  const duplicate = existing.find(
    r => r.CID === data.CID || r.UserId === data.UserId
  );
  if (duplicate) throw new Error("Duplicate CID or UserId");

  const row = [
    data.CID || "",
    data.NAME || "",
    data.LNAME || "",
    data.Picture || "",
    data.DisplayName || "",
    data.UserId || "",
    data.Status || "",
    data.PictureUrl || ""
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_FOLLOW}!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] }
  });
}


/*****************************************************************
 * FUNCTION: updateFollowService
 * หน้าที่:
 * - อัปเดต CID + ชื่อ จาก userId
 * - รับ params: userId, fullName, cid
 *****************************************************************/
async function updateFollowService(userId, fullName, cid) {
  const sheets = await getSheetsInstance();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_FOLLOW}!A2:H`
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[5] === userId);
  if (rowIndex === -1) throw new Error("User not found");

  const [name = "", lname = ""] = (fullName || "").split(" ");
  const updateRange = `${process.env.SHEET_FOLLOW}!A${rowIndex + 2}:C${rowIndex + 2}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: updateRange,
    valueInputOption: "RAW",
    requestBody: { values: [[cid || "", name, lname]] }
  });
}


/*****************************************************************
 * FUNCTION: deleteFollowByCidService
 * หน้าที่:
 * - ลบ follower ตาม CID
 * - ใช้วิธี rewrite sheet ทั้งหมด
 * - รับ param: cid
 *****************************************************************/
async function deleteFollowByCidService(cid) {
  const sheets = await getSheetsInstance();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_FOLLOW}!A2:H`
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[0] === cid); // สมมติ CID อยู่คอลัมน์ A
  if (rowIndex === -1) throw new Error("CID not found");

  rows.splice(rowIndex, 1);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_FOLLOW}!A2:H`,
    valueInputOption: "RAW",
    requestBody: { values: rows }
  });
}


/*****************************************************************
 * MODULE: EXPORT
 * ส่งออกฟังก์ชันทั้งหมดให้ controller ใช้งาน
 *****************************************************************/
module.exports = {
  getDashboardSummaryService,
  getFollowListService,
  addFollowerService,
  updateFollowService,
  deleteFollowByCidService
};