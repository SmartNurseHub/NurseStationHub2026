const lineAPI = require("./lineOA.line.service");
const nursingService = require("../nursingRecords/nursingRecords.service");
const { appendRow, readRows, updateRow } = require("../../config/google");

const LINE_UID_SHEET = "LineUID";

/* =====================================================
   HANDLE FOLLOW
===================================================== */
exports.handleFollowEvent = async (event) => {
  try {
    const userId = event.source.userId;
    const profile = await lineAPI.getProfile(userId);

    const rows = await readRows(LINE_UID_SHEET);
    const index = rows.findIndex(r => r[4] === userId);

    const rowData = [
      new Date().toISOString(),
      "",
      "",
      "",
      userId,
      profile.displayName || "",
      profile.pictureUrl || "",
      "PENDING"
    ];

    if (index !== -1) {
      await updateRow(LINE_UID_SHEET, index + 2, rowData);
    } else {
      await appendRow(LINE_UID_SHEET, rowData);
    }

  } catch (err) {
    console.error("handleFollowEvent error:", err.message);
  }
};


/* =====================================================
   HANDLE MESSAGE
===================================================== */
exports.handleChatMessage = async (event) => {
  try {
    const userId = event.source.userId;
    const text = event.message.text.trim();

    /* ================= CONFIRM RESULT ================= */
    if (text.startsWith("CONFIRM_RESULT:")) {

      const nsr = text.split(":")[1]?.trim();

      await nursingService.updateByNSR(nsr, {
        ResultConfirmed: "YES",
        ConfirmedAt: new Date().toISOString()
      });

      await lineAPI.replyMessage(event.replyToken, {
        type: "text",
        text: "✅ ระบบบันทึกการยืนยันเรียบร้อยแล้ว ขอบพระคุณค่ะ 🙏"
      });

      return;
    }

    /* ================= LINK CID ================= */
    if (/^\d{13}$/.test(text)) {

      const cid = text;

      const patients = await readRows("Patients");
      const patient = patients.find(p => String(p[0]).trim() === cid);

      if (!patient) {
        await lineAPI.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ ไม่พบเลขบัตรประชาชนในระบบ"
        });
        return;
      }

      const lineRows = await readRows(LINE_UID_SHEET);

      const existingCID = lineRows.find(r =>
        String(r[1]).trim() === cid &&
        String(r[7]).trim().toUpperCase() === "ACTIVE"
      );

      if (existingCID) {
        await lineAPI.replyMessage(event.replyToken, {
          type: "text",
          text: "⚠ เลขบัตรนี้ถูกผูกกับ LINE แล้ว"
        });
        return;
      }

      const profile = await lineAPI.getProfile(userId);

      const newRow = [
        new Date().toISOString(),
        patient[0],
        patient[2],
        patient[3],
        userId,
        profile.displayName || "",
        profile.pictureUrl || "",
        "ACTIVE"
      ];

      const pendingIndex = lineRows.findIndex(r =>
        String(r[4]).trim() === userId
      );

      if (pendingIndex !== -1) {
        await updateRow(LINE_UID_SHEET, pendingIndex + 2, newRow);
      } else {
        await appendRow(LINE_UID_SHEET, newRow);
      }

      await lineAPI.replyMessage(event.replyToken, {
        type: "text",
        text: "✅ ผูก LINE สำเร็จแล้ว"
      });

      return;
    }

  } catch (err) {
    console.error("handleChatMessage error:", err.message);
  }
};


/* =====================================================
   SEND REPORT (ใช้ pushFlexResult ตัวเดียว)
===================================================== */
exports.sendReport = async (nsr) => {

  const record = await nursingService.getByNSR(nsr);
  if (!record) throw new Error("ไม่พบ NSR");

  if (["YES", "LOCKED"].includes(record.LineSent)) {
    throw new Error("ผลนี้กำลังส่งหรือส่งไปแล้ว");
  }

  await nursingService.updateByNSR(nsr, {
    LineSent: "LOCKED"
  });

  try {

    const cid = String(record.CID).trim();
    const lineRows = await readRows(LINE_UID_SHEET);

    const userRow = lineRows.find(r =>
      String(r[1]).trim() === cid &&
      String(r[7]).trim().toUpperCase() === "ACTIVE"
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

    await nursingService.updateByNSR(nsr, {
      LineSent: "YES",
      LineSentAt: new Date().toISOString()
    });

    return true;

  } catch (err) {

    await nursingService.updateByNSR(nsr, {
      LineSent: "ERROR"
    });

    throw err;
  }
};
