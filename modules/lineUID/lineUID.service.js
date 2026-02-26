const {
  appendRow,
  getSheetRows,
  findRowByCID,
  deleteRow
} = require("../../config/google");

/* ================================
   ADD LINE UID
================================ */
async function addLineUID(data) {

  const sheetName = process.env.SHEET_LineUID;

  if (!sheetName) {
    throw new Error("SHEET_LineUID not defined in .env");
  }

  const row = [
    new Date().toISOString(),
    data.CID ?? data.cid ?? "",
    data.NAME ?? data.name ?? "",
    data.LNAME ?? data.lname ?? "",
    data.UserId ?? data.userId ?? "",
    data.DisplayName ?? data.displayName ?? "",
    data.Picture ?? data.picture ?? "",
    data.Status ?? data.status ?? "",
    data.PictureUrl ?? data.pictureUrl ?? ""
  ];

  await appendRow(sheetName, row);

  return { success: true };
}

/* ================================
   GET LINE UID LIST
================================ */
async function getLineUIDList() {

  const sheetName = process.env.SHEET_LineUID;

  const rows = await getSheetRows(sheetName);

  if (!rows || rows.length === 0) return [];

  return rows.map(row => ({
    timestamp: row[0] || "",
    cid: row[1] || "",
    name: row[2] || "",
    lname: row[3] || "",
    userId: row[4] || "",
    displayName: row[5] || "",
    picture: row[6] || "",
    status: row[7] || "",
    pictureUrl: row[8] || ""
  }));
}

/* ================================
   DELETE BY CID
================================ */
async function deleteLineUID(cid) {

  const sheetName = process.env.SHEET_LineUID;

  const rowNumber = await findRowByCID(sheetName, cid);

  if (!rowNumber) {
    throw new Error("CID not found");
  }

  await deleteRow(sheetName, rowNumber);

  return { success: true };
}

module.exports = {
  addLineUID,
  getLineUIDList,
  deleteLineUID
};