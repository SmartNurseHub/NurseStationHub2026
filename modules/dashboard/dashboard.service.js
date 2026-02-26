/*************************************************
 * modules/dashboard/dashboard.service.js
 *************************************************/
const { google } = require("googleapis");
const { getAuth } = require("../../config/google");

/* =================================================
   HELPER: GET SHEETS INSTANCE
================================================= */
async function getSheetsInstance() {
  const auth = await getAuth();
  return google.sheets({ version: "v4", auth });
}
/* =================================================
   SUMMARY SERVICE
================================================= */
async function getDashboardSummaryService() {
  return {
    patients: 0,
    appointmentsToday: 0,
    records: 0,
    pending: 0
  };
}

/* =================================================
   GET FOLLOW LIST
================================================= */
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


async function addFollowerService(data) {
  const sheets = await getSheetsInstance();

  // โหลดก่อนเพื่อกันซ้ำ
  const existing = await getFollowListService();

  const duplicate = existing.find(
    r => r.CID === data.CID || r.UserId === data.UserId
  );

  if (duplicate) {
    throw new Error("Duplicate CID or UserId");
  }

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
/* =================================================
   UPDATE FOLLOW (FullName + CID)
================================================= */
async function updateFollowService(userId, fullName, cid) {
  const sheets = await getSheetsInstance();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_FOLLOW}!A2:H`
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[5] === userId);

  if (rowIndex === -1) {
    throw new Error("User not found");
  }

  const [name = "", lname = ""] = (fullName || "").split(" ");

  const updateRange =
    `${process.env.SHEET_FOLLOW}!A${rowIndex + 2}:C${rowIndex + 2}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: updateRange,
    valueInputOption: "RAW",
    requestBody: {
      values: [[cid || "", name, lname]]
    }
  });
}

/* =================================================
   DELETE FOLLOW
================================================= */
async function deleteFollowService(sheetRowNumber) {
  const sheets = await getSheetsInstance();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_FOLLOW}!A2:H`
  });

  const rows = res.data.values || [];

  const arrayIndex = sheetRowNumber - 2;

  if (arrayIndex < 0 || arrayIndex >= rows.length) {
    throw new Error("Row not found");
  }

  rows.splice(arrayIndex, 1);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_FOLLOW}!A2:H`,
    valueInputOption: "RAW",
    requestBody: { values: rows }
  });
}
module.exports = {
  getDashboardSummaryService,
  getFollowListService,
  updateFollowService,
  deleteFollowService,
  addFollowerService
};