/*****************************************************************
 * dashboard.service.js (FINAL CLEAN PRODUCTION)
 *****************************************************************/

const { getSheets } = require("../../config/google");

/*****************************************************************
 * GET SHEETS
 *****************************************************************/
async function getSheetsInstance() {
  return await getSheets();
}

/*****************************************************************
 * SUMMARY
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
 * FOLLOW LIST
 *****************************************************************/
async function getFollowListService() {
  try {
    const sheets = await getSheetsInstance();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${process.env.SHEET_LINEUID}!A2:H`
    });

    const rows = res.data.values || [];

    const clean = v => (v || "").toString().trim();

return rows.map(r => ({
  cid: clean(r[1]),
  name: clean(r[2]),
  lname: clean(r[3]),
  userId: clean(r[4]),
  displayName: clean(r[5]),
  pictureUrl: clean(r[6]),
  status: clean(r[7])
}));


  } catch (err) {
    console.error("❌ getFollowListService error:", err.message);
    return [];
  }
}

/*****************************************************************
 * ADD FOLLOWER
 *****************************************************************/
async function addFollowerService(data) {
  const sheets = await getSheetsInstance();
  const existing = await getFollowListService();

  const clean = v => (v || "").toString().trim();

  const duplicate = existing.find(
    r => clean(r.cid) === clean(data.CID) ||
         clean(r.userId) === clean(data.UserId)
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
 * UPDATE FOLLOW
 *****************************************************************/
async function updateFollowService(userId, fullName, cid) {
  const sheets = await getSheetsInstance();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_FOLLOW}!A2:H`
  });

  const rows = res.data.values || [];

  const clean = v => (v || "").toString().trim();

  const rowIndex = rows.findIndex(r => clean(r[5]) === clean(userId));

  if (rowIndex === -1) throw new Error("User not found");

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

/*****************************************************************
 * DELETE FOLLOW BY CID (🔥 FIX จริง)
 *****************************************************************/
async function deleteFollowByCidService(cid) {
  const sheets = await getSheetsInstance();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_LINEUID}!A2:I`
  });

  const rows = res.data.values || [];

  const clean = v => (v || "").toString().trim();
  const targetCid = clean(cid);

  console.log("🔍 FIND CID (LineUID):", targetCid);

  const rowIndex = rows.findIndex(r => clean(r[1]) === targetCid);

  if (rowIndex === -1) {
    console.error("❌ CID NOT FOUND (LineUID)", {
      targetCid,
      sample: rows.slice(0, 5)
    });
    throw new Error("CID not found in LineUID");
  }

  console.log("✅ FOUND ROW:", rowIndex + 2);

  rows.splice(rowIndex, 1);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_LINEUID}!A2:I`,
    valueInputOption: "RAW",
    requestBody: { values: rows }
  });
}
/*****************************************************************
 * EXPORT
 *****************************************************************/
module.exports = {
  getDashboardSummaryService,
  getFollowListService,
  addFollowerService,
  updateFollowService,
  deleteFollowByCidService
};