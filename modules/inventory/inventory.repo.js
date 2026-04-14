const {
  readRowsById,
  clearSheetById,
  getSheets
} = require("../../config/google");

const DB = process.env.INVENTORY_SPREADSHEET_ID;
const SHEET_MASTER = process.env.SHEET_INVENTORY_MASTER;

/* ===============================
   GET MASTER
================================ */
async function getMaster() {
  const rows = await readRowsById(DB, SHEET_MASTER);

  if (!rows || rows.length <= 1) return [];

  const [, ...data] = rows;

  return data.map(r => ({
    id: r[0],
    name: r[1],
    size: r[2],
    min_qty: Number(r[3] || 0),
    unit: r[4]
  }));
}

/* ===============================
   REPLACE MASTER (FIXED - NO LOOP)
================================ */
async function replaceMaster(data) {
  const sheets = await getSheets();

  const header = ["id", "name", "size", "min_qty", "unit"];

  const values = [
    header,
    ...data.map(r => ([
      r.id || "",
      r.name || "",
      r.size || "",
      r.min_qty || 0,
      r.unit || ""
    ]))
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: DB,
    range: `${SHEET_MASTER}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values
    }
  });

  return true;
}

async function replaceLot(data){

  const sheets = await getSheets();

  const values = [
    ["Lotid","Item_id","lot","Exp","Qty","Status","QRCode","providers"],
    ...data.map(r=>[
      r.Lotid||"",
      r.Item_id||"",
      r.lot||"",
      r.Exp||"",
      r.Qty||0,
      r.Status||"ACTIVE",
      r.QRCode||"",
      r.providers||""
    ])
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: DB,
    range: `${SHEET_LOT}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody:{values}
  });

  return true;
}

module.exports = {
  getMaster,
  replaceMaster,
  replaceLot
};