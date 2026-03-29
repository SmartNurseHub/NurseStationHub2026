/*****************************************************************
 * FOLLOW LIST SERVICE MODULE
 * NurseStationHub
 *
 * ---------------------------------------------------------------
 * หน้าที่:
 * - จัดการข้อมูล Follow (LINE OA / User)
 * - บันทึก / อัปเดตข้อมูลลง Google Sheet
 * - ดึงรายการ Follow ล่าสุดสำหรับใช้งาน
 *
 * ---------------------------------------------------------------
 * FUNCTION LIST:
 *
 * 1. saveFollow(data)
 *    → Upsert ข้อมูล (insert/update โดยใช้ CID)
 *
 * 2. getFollowList()
 *    → ดึง user ที่กด follow ล่าสุด
 *
 * ---------------------------------------------------------------
 * FLOW:
 * Controller → Service → Google Sheet
 *****************************************************************/


/* =========================================================
   IMPORTS
========================================================= */

const {
  appendRow,
  findRowByCID,
  updateRow,
  getSheetRows
} = require('../../config/google');


/* =========================================================
   FOLLOW WRITE (CREATE / UPDATE)
========================================================= */

/**
 * บันทึกหรืออัปเดตข้อมูล Follow (Upsert by CID)
 */
exports.saveFollow = async (data) => {
  try {

    /* ===============================
       VALIDATION
    =============================== */
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid follow data");
    }

    const {
      cid,
      name,
      lname,
      userId,
      displayName,
      picture,
      status,
      pictureUrl
    } = data;

    const sheetName = process.env.SHEET_FOLLOW;

    if (!sheetName) {
      throw new Error("SHEET_FOLLOW is not defined in .env");
    }


    /* ===============================
       PREPARE VALUES
    =============================== */
    const values = [
      new Date().toISOString(),
      cid || "",
      name || "",
      lname || "",
      userId || "",
      displayName || "",
      picture || "",
      status || "",
      pictureUrl || ""
    ];


    /* ===============================
       UPSERT LOGIC
    =============================== */

    // กรณีไม่มี CID → append อย่างเดียว
    if (!cid) {
      await appendRow(sheetName, values);
      return { action: "appended_no_cid" };
    }

    const rowNumber = await findRowByCID(sheetName, cid);

    // ถ้ามี row → update
    if (rowNumber) {
      await updateRow(sheetName, rowNumber, values);
      return { action: "updated", rowNumber };
    }

    // ถ้าไม่มี → append ใหม่
    await appendRow(sheetName, values);
    return { action: "appended" };

  } catch (err) {
    console.error("saveFollow error:", err);
    throw err;
  }
};


/* =========================================================
   FOLLOW READ (QUERY)
========================================================= */

/**
 * ดึงรายการ Follow สำหรับนำไป fill dropdown
 */
exports.getFollowList = async () => {

  const rows = await getSheetRows(process.env.SHEET_FOLLOW);

  const latestMap = new Map();


  /* ===============================
     PROCESS: เก็บค่าล่าสุดต่อ user
  =============================== */
  rows.forEach(row => {

    const eventType   = row[1];
    const userId      = row[2];
    const displayName = row[3];
    const pictureUrl  = row[4];
    const picture     = row[5];

    if (!userId) return;

    latestMap.set(userId, {
      userId,
      displayName,
      eventType,
      pictureUrl,
      picture
    });

  });


  /* ===============================
     FILTER: เอาเฉพาะ follow
  =============================== */
  return Array.from(latestMap.values())
    .filter(user => user.eventType === "follow");

};