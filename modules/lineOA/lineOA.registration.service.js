/******************************************************************
 * lineOA.registration.service.js
 * จัดการ Flow ลงทะเบียน LINE OA
 * STEP
 * 1. CID
 * 2. NAME
 * 3. PHONE
 ******************************************************************/

const { readRows, updateRow } = require("../../config/google");

const LINE_UID_SHEET = "LineUID";

/* ==========================================================
   MAIN REGISTRATION FLOW
   return true  = handled แล้ว
   return false = ไม่เกี่ยวกับ registration
========================================================== */

exports.handleRegistrationFlow = async (lineAPI, userId, text, replyToken) => {

  try {

    text = (text || "").trim();

    const rows = await readRows(LINE_UID_SHEET);

    const rowIndex = rows.findIndex((r, i) =>
      i > 0 && String(r[4] || "").trim() === userId
    );

    if (rowIndex === -1) return false;

    const row = rows[rowIndex];
    const status = String(row[7] || "").trim();

    console.log("Registration flow:", userId, "status:", status);

    /* ================= STEP 1 : CID ================= */

    if (status === "PENDING_CID") {

      if (!/^\d{13}$/.test(text)) {

        await lineAPI.replyMessage(replyToken, {
          type: "text",
          text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก"
        });

        return true;
      }

      row[1] = text;
      row[7] = "PENDING_NAME";

      await lineAPI.replyMessage(replyToken, {
        type: "text",
        text: "กรุณากรอกชื่อ–นามสกุล"
      });

      updateRow(LINE_UID_SHEET, rowIndex + 1, row)
        .catch(err => console.error("Sheet update error:", err));

      return true;
    }

    /* ================= STEP 2 : NAME ================= */

    if (status === "PENDING_NAME") {

      const parts = text.split(" ");

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

      await lineAPI.replyMessage(replyToken, {
        type: "text",
        text: "กรุณากรอกเบอร์โทรศัพท์"
      });

      updateRow(LINE_UID_SHEET, rowIndex + 1, row)
        .catch(err => console.error("Sheet update error:", err));

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

      await lineAPI.replyMessage(replyToken, {
        type: "text",
        text: "✅ ลงทะเบียนสำเร็จแล้ว\nขอบคุณที่ใช้บริการค่ะ"
      });

      updateRow(LINE_UID_SHEET, rowIndex + 1, row)
        .catch(err => console.error("Sheet update error:", err));

      return true;
    }

    return false;

  } catch (err) {

    console.error("Registration flow error:", err);

    return false;
  }

};