/*****************************************************************
 * lineUID.service.js (FINAL FIX)
 *****************************************************************/

const { readRows, appendRow } = require("../../config/google");

const SHEET = "LineUID";

/* =========================================================
   GET LIST
========================================================= */

exports.getLineUIDList = async () => {

  try {

    const rows = await readRows(SHEET);

    if (!rows || rows.length <= 1) return [];

    return rows.slice(1).map(r => ({
      timestamp: r[0] || "",
      cid: r[1] || "",
      name: r[2] || "",
      lname: r[3] || "",
      userId: r[4] || "",
      displayName: r[5] || "",
      pictureUrl: r[6] || "",
      status: r[7] || "",
      phone: r[8] || ""
    }));

  } catch (err) {

    console.error("❌ getLineUIDList:", err);
    throw err;

  }

};


/* =========================================================
   ADD
========================================================= */

exports.addLineUID = async (data) => {

  const now = new Date().toISOString();

  await appendRow(SHEET, [
    now,
    data.cid || "",
    data.name || "",
    data.lname || "",
    data.userId || "",
    data.displayName || "",
    data.pictureUrl || "",
    data.status || "ACTIVE",
    data.phone || ""
  ]);

};


/* =========================================================
   DELETE (optional)
========================================================= */

exports.deleteLineUID = async (cid) => {

  // 🔥 NOTE:
  // Google Sheet delete ต้องใช้ row index
  // ถ้าจะทำจริง ต้องใช้ findRowByCID ก่อน

  console.log("Delete CID:", cid);

};