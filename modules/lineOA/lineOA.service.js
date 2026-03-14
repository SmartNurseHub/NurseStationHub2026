/******************************************************************
 * lineOA.service.js
 * จัดการ LINE Follow / Message / Send Result
 ******************************************************************/

const lineAPI = require("./lineOA.line.service");
const nursingService = require("../nursingRecords/nursingRecords.service");
const { appendRow, readRows, updateRow } = require("../../config/google");
const registrationService = require("./lineOA.registration.service");

const LINE_UID_SHEET = "LineUID";
const USER_SHEET = "UserList";

/* =====================================================
   HANDLE FOLLOW
===================================================== */
exports.handleFollowEvent = async (event) => {
  try {

    const userId = String(event.source.userId).trim();
    const profile = await lineAPI.getProfile(userId);
    const rows = await readRows(LINE_UID_SHEET);

    const index = rows.findIndex((r, i) =>
      i > 0 && String(r[4] || "").trim() === userId
    );

    const rowData = [
      new Date().toISOString(),   // 0 Timestamp
      "",                         // 1 cid
      "",                         // 2 name
      "",                         // 3 lname
      userId,                     // 4 userId
      profile.displayName || "",  // 5 displayName
      profile.pictureUrl || "",   // 6 pictureUrl
      "PENDING_CID",              // 7 status
      ""                          // 8 phone
    ];

    if (index !== -1) {
      await updateRow(LINE_UID_SHEET, index + 1, rowData);
    } else {
      await appendRow(LINE_UID_SHEET, rowData);
    }

    // ✅ ถามอัตโนมัติทันทีหลัง Follow
    await lineAPI.replyMessage(event.replyToken, {
      type: "text",
      text: "สวัสดีค่ะ 👋\nกรุณากรอกเลขบัตรประชาชน 13 หลัก (ตัวเลขติดกัน)"
    });

  } catch (err) {
    console.error("handleFollowEvent error:", err.message);
  }
};


/* =====================================================
   HANDLE MESSAGE
===================================================== */
exports.handleChatMessage = async (event) => {

  try {

    let payload = "";

    if (event.type === "message") {
      payload = (event.message?.text || "").trim();
    }

    if (event.type === "postback") {
      payload = (event.postback?.data || "").trim();
    }

    console.log("PAYLOAD:", payload);

    /* ===== CONFIRM RESULT ===== */

    if (payload.startsWith("CONFIRM_RESULT:")) {

      const nsr = payload.split(":")[1]?.trim();

      console.log("CONFIRM NSR:", nsr);

      const record = await nursingService.getByNSR(nsr);

      if (record.ResultConfirmed === "YES") {

        await lineAPI.replyMessage(event.replyToken,{
          type:"text",
          text:"ℹ️ ระบบบันทึกการยืนยันไว้แล้วค่ะ"
        });

        return;
      }

      await nursingService.markResultConfirmed(nsr);

      await lineAPI.replyMessage(event.replyToken,{
        type:"text",
        text:"✅ ระบบบันทึกการยืนยันการรับผลตรวจเรียบร้อยแล้ว ขอบพระคุณค่ะ 🙏"
      });

      return;

    }

  } catch (err) {

    console.error("Confirm error:", err);

    await lineAPI.replyMessage(event.replyToken,{
      type:"text",
      text:"❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
    });

  }

};


/* =====================================================
   SEND REPORT
===================================================== */
exports.sendReport = async (nsr) => {

  const record = await nursingService.getByNSR(nsr);
  if (!record) throw new Error("ไม่พบ NSR");

  if (["YES", "LOCKED"].includes(record.LineSent)) {
    throw new Error("ผลนี้กำลังส่งหรือส่งไปแล้ว");
  }

  const cid = String(record.CID).trim();
  const lineRows = await readRows(LINE_UID_SHEET);

  const userRow = lineRows.find(r =>
    String(r[1] || "").trim() === cid &&
    String(r[7] || "").trim().toUpperCase() === "ACTIVE"
  );

  if (!userRow) throw new Error("ยังไม่ได้ผูก LINE");

  const userId = userRow[4];

  await lineAPI.pushFlexResult({
    userId,
    nsr,
    fullName: `${record.PRENAME || ""}${record.NAME || ""} ${record.LNAME || ""}`,
    dateService: record.DateService,
    list: record.Activity,
    result: record.HealthInform,
    advice: record.HealthAdvice,
    status: record.status,
    fileURL: record.fileURL || null
  });
  return true;

};
exports.confirmResult = async (nsr) => {

  console.log("Confirm result:", nsr);

  await nursingService.markResultConfirmed(nsr);

};