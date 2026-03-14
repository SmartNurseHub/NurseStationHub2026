const {
  appendRow,
  getSheetRows,
  findRowByCID,
  deleteRow,
  readRows,
  updateRow
} = require("../../config/google");

const { LINE_UID_SHEET } = require("./lineUID.schema");

/* ================================
   ADD LINE UID
================================ */
async function addLineUID(data) {

  const sheetName = LINE_UID_SHEET;

  if (!sheetName) {
    throw new Error("LINE_UID_SHEET not defined");
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
   GET LIST
================================ */
async function getLineUIDList() {

  const rows = await getSheetRows(LINE_UID_SHEET);

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

  const rowNumber = await findRowByCID(LINE_UID_SHEET, cid);

  if (!rowNumber) {
    throw new Error("CID not found");
  }

  await deleteRow(LINE_UID_SHEET, rowNumber);

  return { success: true };

}

/* ================================
   UPDATE LINE UID
================================ */
async function updateLineUID(userId, patient) {

  const rows = await readRows(LINE_UID_SHEET);

  const index = rows.findIndex(
    r => String(r[4] || "").trim() === String(userId).trim()
  );

  if (index !== -1) {

    rows[index][1] = patient[0];
    rows[index][2] = patient[2];
    rows[index][3] = patient[3];
    rows[index][7] = "ACTIVE";

    await updateRow(
      LINE_UID_SHEET,
      index + 2,
      rows[index]
    );

  }

}

module.exports = {
  addLineUID,
  getLineUIDList,
  updateLineUID,
  deleteLineUID
};