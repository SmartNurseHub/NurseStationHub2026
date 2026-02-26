const {
  appendRow,
  findRowByCID,
  updateRow,
  getSheetRows
} = require('../../config/google');

/**
 * บันทึกหรืออัปเดตข้อมูล Follow (Upsert by CID)
 */
exports.saveFollow = async (data) => {
  try {
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

    // ถ้าไม่มี CID → append อย่างเดียว
    if (!cid) {
      await appendRow(sheetName, values);
      return { action: "appended_no_cid" };
    }

    const rowNumber = await findRowByCID(sheetName, cid);

    if (rowNumber) {
      await updateRow(sheetName, rowNumber, values);
      return { action: "updated", rowNumber };
    }

    await appendRow(sheetName, values);
    return { action: "appended" };

  } catch (err) {
    console.error("saveFollow error:", err);
    throw err;
  }
};


/**
 * ดึงรายการ Follow สำหรับนำไป fill dropdown
 */

exports.getFollowList = async () => {
  const rows = await getSheetRows(process.env.SHEET_FOLLOW);

  const latestMap = new Map();

  rows.forEach(row => {
    const eventType = row[1];
    const userId = row[2];
    const displayName = row[3];
    const pictureUrl = row[4];
    const picture = row[5];

    if (!userId) return;

    latestMap.set(userId, {
      userId,
      displayName,
      eventType,
      pictureUrl,
      picture
    });
  });

  return Array.from(latestMap.values())
    .filter(user => user.eventType === "follow");
};