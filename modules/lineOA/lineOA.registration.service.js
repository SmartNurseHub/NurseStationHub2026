/*****************************************************************
 * LINE REGISTRATION SERVICE MODULE
 * NurseStationHub (Production Stable)
 *
 * ---------------------------------------------------------------
 * หน้าที่:
 * - จัดการ flow การลงทะเบียนผู้ใช้ผ่าน LINE OA
 * - บันทึกข้อมูลลง Google Sheet
 * - ใช้ state machine (status) ควบคุมขั้นตอน
 *
 * ---------------------------------------------------------------
 * REGISTRATION FLOW:
 *
 * STEP 1: PENDING_CID
 *   → รับเลขบัตรประชาชน
 *
 * STEP 2: PENDING_NAME
 *   → รับชื่อ-นามสกุล
 *
 * STEP 3: PENDING_PHONE
 *   → รับเบอร์โทรศัพท์
 *
 * STEP 4: ACTIVE
 *   → ลงทะเบียนเสร็จสมบูรณ์
 *
 * ---------------------------------------------------------------
 * OPTIMIZATION:
 * - ใช้ Cache ลดการเรียก Google Sheet
 *
 * ---------------------------------------------------------------
 * FLOW:
 * Webhook → Controller → Registration Service → Google Sheet
 *****************************************************************/


/* =========================================================
   IMPORTS
========================================================= */

const { readRows, updateRow } = require("../../config/google");
const { LINE_UID_SHEET } = require("./lineOA.schema");


/* =========================================================
   CACHE (ลดการเรียก Google Sheet)
========================================================= */

let sheetCache = null;
let lastLoad = 0;
const CACHE_TIME = 3000;

/**
 * โหลดข้อมูลจาก Sheet (ใช้ cache)
 */
async function getRows() {

  const now = Date.now();

  if (!sheetCache || (now - lastLoad) > CACHE_TIME) {

    try {

      const rows = await readRows(LINE_UID_SHEET);

      sheetCache = rows || [];
      lastLoad = now;

    } catch (err) {

      console.error("Sheet load error:", err);
      sheetCache = [];

    }

  }

  return sheetCache;
}


/* =========================================================
   CACHE CONTROL
========================================================= */

/**
 * ล้าง cache หลัง update
 */
function clearCache() {
  sheetCache = null;
}

function normalize(v) {
  return String(v || "").trim();
}
/* =========================================================
   MAIN REGISTRATION FLOW (STATE MACHINE)
========================================================= */

/**
 * handleRegistrationFlow
 * ใช้ควบคุม flow การลงทะเบียนทีละ step
 */
exports.handleRegistrationFlow = async (lineClient, userId, text, replyToken) => {
  try {
    text = (text || "").trim();

    if (!userId) return false;

    const rows = await getRows();

    if (!rows.length) {
      console.log("❌ Sheet empty or load fail");
      return false;
    }

    console.log("🔍 USER ID:", userId);

    rows.forEach((r, i) => {
      if (i === 0) return;
      console.log("Sheet UID:", `[${r[4]}]`);
    });

    const rowIndex = rows.findIndex((r, i) => i > 0 && normalize(r[4]) === normalize(userId));
    if (rowIndex === -1) return false;

    const row = rows[rowIndex];
    const status = String(row[7] || "").trim();

    console.log("Registration flow:", userId, "status:", status);

    /* =====================================================
       STEP 1 : CID (เลขบัตรประชาชน)
    ===================================================== */
    if (status === "PENDING_CID") {
      if (!/^\d{13}$/.test(text)) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก"
        });
        return true;
      }

      row[1] = text;
      row[7] = "PENDING_NAME";

      await updateRow(LINE_UID_SHEET, rowIndex + 1, row);

      clearCache();
      await getRows(); // reload ทันที

      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "กรุณากรอกชื่อ–นามสกุล"
      });

      return true;
    }

    /* =====================================================
       STEP 2 : NAME (ชื่อ-นามสกุล)
    ===================================================== */
    if (status === "PENDING_NAME") {
      const parts = text.split(" ").filter(v => v);

      if (parts.length < 2) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "กรุณากรอกชื่อและนามสกุล เว้นวรรค 1 ครั้ง"
        });
        return true;
      }

      row[2] = parts[0];
      row[3] = parts.slice(1).join(" ");
      row[7] = "PENDING_PHONE";

      await updateRow(LINE_UID_SHEET, rowIndex + 1, row);

      clearCache();

      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "กรุณากรอกเบอร์โทรศัพท์"
      });

      return true;
    }

    /* =====================================================
       STEP 3 : PHONE (เบอร์โทร)
    ===================================================== */
    if (status === "PENDING_PHONE") {
      if (!/^0\d{8,9}$/.test(text)) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "กรุณากรอกเบอร์โทรให้ถูกต้อง"
        });
        return true;
      }

      row[8] = text;
      row[7] = "ACTIVE";

      await updateRow(LINE_UID_SHEET, rowIndex + 1, row);

      clearCache();

      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "ลงทะเบียนสำเร็จแล้ว 🎉"
      });

      return true;
    }

    /* =====================================================
       STEP 4 : ACTIVE (สำคัญมาก)
    ===================================================== */
    if (status === "ACTIVE") {
      if (text === "สมัคร") {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "คุณได้ลงทะเบียนแล้วเรียบร้อย ✅"
        });
        return true;
      }

      // 👉 ปล่อยให้ controller ไป handle feature อื่น
      return false;
    }

    /* =====================================================
       DEFAULT
    ===================================================== */
    return false;

  } catch (err) {
    console.error("Registration flow error:", err);

    try {
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง"
      });
    } catch (e) {}

    return false;
  }
};