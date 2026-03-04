/******************************************************************
 * lineOA.registration.service.js
 * จัดการ Flow ลงทะเบียน 4 ขั้นตอน
 ******************************************************************/
const { readRows, updateRow } = require("../../config/google");

const LINE_UID_SHEET = "LineUID";

/* ==========================================================
   MAIN REGISTRATION FLOW
   return true = handled แล้ว
   return false = ไม่เกี่ยวกับ registration
========================================================== */
exports.handleRegistrationFlow = async (lineAPI, userId, text, replyToken) => {

  const rows = await readRows(LINE_UID_SHEET);

  const rowIndex = rows.findIndex((r, i) =>
    i > 0 && String(r[4] || "").trim() === userId
  );

  if (rowIndex === -1) return false;

  const row = rows[rowIndex];
  const status = String(row[7] || "").trim();

  /* ================= STEP 1 : CID ================= */
  if (status === "PENDING_CID") {

    if (!/^\d{13}$/.test(text)) {
      await lineAPI.replyMessage(replyToken, {
        type: "text",
        text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก (ตัวเลขติดกัน)"
      });
      return true;
    }

    row[1] = text;
    row[7] = "PENDING_NAME";

    await updateRow(LINE_UID_SHEET, rowIndex + 1, row);

    await lineAPI.replyMessage(replyToken, {
      type: "text",
      text: "กรุณากรอกชื่อ–นามสกุล"
    });

    return true;
  }

  /* ================= STEP 2 : NAME ================= */
  if (status === "PENDING_NAME") {

    const parts = text.trim().split(" ");
    if (parts.length < 2) {
      await lineAPI.replyMessage(replyToken, {
        type: "text",
        text: "กรุณากรอกชื่อและนามสกุล เว้นวรรค 1 ครั้ง"
      });
      return true;
    }

    row[2] = parts[0];
    row[3] = parts.slice(1).join(" ");
    row[7] = "PENDING_PHONE";

    await updateRow(LINE_UID_SHEET, rowIndex + 1, row);

    await lineAPI.replyMessage(replyToken, {
      type: "text",
      text: "กรุณากรอกเบอร์โทรศัพท์"
    });

    return true;
  }

  /* ================= STEP 3 : PHONE ================= */
  if (status === "PENDING_PHONE") {

    if (!/^0\d{8,9}$/.test(text)) {
      await lineAPI.replyMessage(replyToken, {
        type: "text",
        text: "กรุณากรอกเบอร์โทรให้ถูกต้อง"
      });
      return true;
    }

    row[8] = text;
    row[7] = "ACTIVE";

    await updateRow(LINE_UID_SHEET, rowIndex + 1, row);

    await lineAPI.replyMessage(replyToken, {
      type: "text",
      text: "✅ ลงทะเบียนสำเร็จแล้ว\nขอบคุณที่ใช้บริการค่ะ"
    });

    return true;
  }

  return false;
};