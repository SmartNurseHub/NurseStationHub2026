/******************************************************************
 * lineOA.service.js
 * LINE OA Service Module
 * NurseStationHub
 ******************************************************************/

/* =========================================================
   IMPORT MODULES
========================================================= */

const { Client } = require("@line/bot-sdk");

const lineAPI = require("./lineOA.line.service");
const nursingService = require("../nursingRecords/nursingRecords.service");

const {
  appendRow,
  readRows,
  updateRow,
  deleteRow
} = require("../../config/google");

/* =========================================================
   LINE CLIENT
========================================================= */

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

/* =========================================================
   SHEET CONFIG
========================================================= */

const LINE_UID_SHEET = "LineUID";
const USER_SHEET = "UserList";
const FOLLOW_SHEET = "FollowList";

/* =========================================================
   UTILITY : SAFE REPLY
========================================================= */

async function safeReply(event, message) {

  if (
    !event ||
    !event.replyToken ||
    event.replyToken === "00000000000000000000000000000000"
  ) {
    console.log("⚠️ Skip reply → invalid token");
    return;
  }

  try {

    await lineClient.replyMessage(event.replyToken, message);

  } catch (err) {

    console.error("LINE REPLY ERROR:", err.message);

  }

}

/* =========================================================
   UTILITY : PUSH MESSAGE
========================================================= */

async function pushMessage(userId, message) {

  if (!userId) throw new Error("userId missing");

  try {

    return await lineClient.pushMessage(userId, message);

  } catch (err) {

    console.error("LINE PUSH ERROR:", err.message);
    throw err;

  }

}

/* =========================================================
   EVENT : FOLLOW
========================================================= */

async function handleFollowEvent(event) {

  try {

    const userId = String(event.source?.userId || "").trim();

    if (!userId) return;

    const profile = await lineAPI.getProfile(userId) || {};

    /* ---------- save follow log ---------- */

    await appendRow(FOLLOW_SHEET, [
      new Date().toISOString(),
      "follow",
      userId,
      profile.displayName || "",
      profile.pictureUrl || "",
      ""
    ]);

    const rows = await readRows(LINE_UID_SHEET) || [];

    const index = rows.findIndex((r, i) =>
      i > 0 && String(r[4] || "").trim() === userId
    );

    const newRow = [
      new Date().toISOString(),
      "",
      "",
      "",
      userId,
      profile.displayName || "",
      profile.pictureUrl || "",
      "WAIT_CID",
      ""
    ];

    if (index !== -1) {

      rows[index][4] = userId;
      rows[index][5] = profile.displayName || "";
      rows[index][6] = profile.pictureUrl || "";

      await updateRow(LINE_UID_SHEET, index + 1, rows[index]);

    } else {

      await appendRow(LINE_UID_SHEET, newRow);

    }

    await safeReply(event, {
      type: "text",
      text: "สวัสดีค่ะ 👋\nกรุณากรอกเลขบัตรประชาชน 13 หลัก"
    });

  } catch (err) {

    console.error("handleFollowEvent error:", err);

  }

}

/* =========================================================
   EVENT : CHAT MESSAGE
========================================================= */

async function handleChatMessage(event) {

  try {

    if (event.type === "message" && event.message.type !== "text") return;

    const userId = event.source?.userId;

    if (!userId) return;

    let payload = "";

    if (event.type === "message") {

      payload = (event.message?.text || "").trim();

    }

    if (event.type === "postback") {

      payload = (event.postback?.data || "").trim();

    }

    if (!payload) return;

    console.log(`📩 MESSAGE ${userId} → ${payload}`);

    await appendRow(USER_SHEET, [
      new Date().toISOString(),
      userId,
      payload
    ]);

    const rows = await readRows(LINE_UID_SHEET) || [];

    const index = rows.findIndex((r, i) =>
      i > 0 && String(r[4] || "").trim() === userId
    );

    if (index === -1) {

      return safeReply(event, {
        type: "text",
        text: "กรุณาเพิ่มเพื่อน LINE ใหม่อีกครั้งค่ะ"
      });

    }

    const status = String(rows[index][7] || "").trim();

    /* =====================================================
       WAIT CID
    ===================================================== */

    if (status === "WAIT_CID") {

      const cid = payload.replace(/\D/g, "");

      if (!/^\d{13}$/.test(cid)) {

        return safeReply(event, {
          type: "text",
          text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก"
        });

      }

      const cidIndex = rows.findIndex((r, i) =>
        i > 0 && String(r[1] || "").trim() === cid
      );

      if (cidIndex !== -1) {

        rows[cidIndex][4] = userId;
        rows[cidIndex][7] = "ACTIVE";

        await updateRow(LINE_UID_SHEET, cidIndex + 1, rows[cidIndex]);

        if (index !== cidIndex) {

          await deleteRow(LINE_UID_SHEET, Math.max(index, cidIndex) + 1);

        }

        return safeReply(event, {
          type: "text",
          text: "เชื่อมต่อ LINE กับข้อมูลผู้ป่วยเรียบร้อยแล้วค่ะ ✅"
        });

      }

      rows[index][1] = cid;
      rows[index][7] = "WAIT_NAME";

      await updateRow(LINE_UID_SHEET, index + 1, rows[index]);

      return safeReply(event, {
        type: "text",
        text: "กรุณากรอกชื่อและนามสกุล\nตัวอย่าง: สมชาย ใจดี"
      });

    }

    /* =====================================================
       WAIT NAME
    ===================================================== */

    if (status === "WAIT_NAME") {

      const parts = payload.split(/\s+/);

      if (parts.length < 2) {

        return safeReply(event, {
          type: "text",
          text: "กรุณากรอกแบบ: ชื่อ นามสกุล"
        });

      }

      rows[index][2] = parts[0];
      rows[index][3] = parts.slice(1).join(" ");
      rows[index][7] = "ACTIVE";

      await updateRow(LINE_UID_SHEET, index + 1, rows[index]);

      return safeReply(event, {
        type: "text",
        text: "ลงทะเบียนสำเร็จแล้วค่ะ 🎉"
      });

    }

    /* =====================================================
       CONFIRM RESULT
    ===================================================== */

    if (payload.startsWith("CONFIRM_RESULT:")) {

      const nsr = payload.split(":")[1]?.trim();

      const record = await nursingService.getByNSR(nsr);

      if (!record) {

        return safeReply(event, {
          type: "text",
          text: "❌ ไม่พบข้อมูลผลตรวจ"
        });

      }

      if (record.ResultConfirmed === "YES") {

        return safeReply(event, {
          type: "text",
          text: "ℹ️ ระบบบันทึกไว้แล้ว"
        });

      }

      await nursingService.markResultConfirmed(nsr);

      return safeReply(event, {
        type: "text",
        text: "✅ ยืนยันรับผลตรวจเรียบร้อยแล้ว"
      });

    }

  } catch (err) {

    console.error("handleChatMessage error:", err);

    await safeReply(event, {
      type: "text",
      text: "❌ ระบบขัดข้อง กรุณาลองใหม่"
    });

  }

}

/* =========================================================
   SERVICE : SEND REPORT
========================================================= */

async function sendReport(nsr) {

  const record = await nursingService.getByNSR(nsr);

  if (!record) throw new Error("ไม่พบ NSR");

  const rows = await readRows(LINE_UID_SHEET);

  const userRow = rows.find(r =>
    String(r[1] || "").trim() === String(record.CID).trim() &&
    String(r[7] || "").toUpperCase() === "ACTIVE"
  );

  if (!userRow) throw new Error("ยังไม่ได้ผูก LINE");

  const userId = String(userRow[4] || "").trim();

  console.log(`📤 Sending result → ${userId}`);

  await lineAPI.pushFlexResult({

    userId,
    nsr,
    fullName: `${record.PRENAME} ${record.NAME} ${record.LNAME}`,
    dateService: record.DateService,
    list: record.Activity,
    result: record.HealthInform,
    advice: record.HealthAdvice,
    status: record.status,
    fileURL: record.fileURL || null

  });

  return true;

}

/* =========================================================
   EVENT : UNFOLLOW
========================================================= */

async function handleUnfollowEvent(event) {

  try {

    const userId = event.source?.userId;

    await appendRow(FOLLOW_SHEET, [
      new Date().toISOString(),
      "unfollow",
      userId,
      "",
      "",
      ""
    ]);

  } catch (err) {

    console.error("handleUnfollowEvent error:", err);

  }

}

/* =========================================================
   EXPORT MODULE
========================================================= */

module.exports = {

  lineClient,

  pushMessage,

  handleFollowEvent,
  handleChatMessage,
  handleUnfollowEvent,

  sendReport

};