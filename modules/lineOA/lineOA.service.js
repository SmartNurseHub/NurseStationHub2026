/******************************************************************
 * lineOA.service.js
 * จัดการ LINE Follow / Message / Send Result
 ******************************************************************/

const lineAPI = require("./lineOA.line.service");
const nursingService = require("../nursingRecords/nursingRecords.service");
const { appendRow, readRows, updateRow, deleteRow } = require("../../config/google");

const LINE_UID_SHEET = "LineUID";
const USER_SHEET = "UserList";
const FOLLOW_SHEET = "FollowList";


async function safeReply(event, message) {

  if (
    !event ||
    !event.replyToken ||
    event.replyToken === "00000000000000000000000000000000"
  ) {
    console.log("⚠️ Invalid replyToken → skip reply");
    return;
  }

  try {

    await lineAPI.replyMessage(event.replyToken, message);

  } catch (err) {

    console.error("LINE REPLY ERROR:", err.message);

  }

}



/* =====================================================
   HANDLE FOLLOW
===================================================== */
exports.handleFollowEvent = async (event) => {

  try {

    const userId = String(event.source.userId).trim();

    const profile = await lineAPI.getProfile(userId) || {};

/* 🔵 บันทึก follow */
await appendRow(FOLLOW_SHEET, [
  new Date().toISOString(),
  "follow",
  userId,
  profile.displayName || "",
  profile.pictureUrl || "",
  ""
]);

    const rows = await readRows(LINE_UID_SHEET);

    const index = rows.findIndex((r,i) =>
  i > 0 && String(r[4] || "").trim() === userId
);

    const rowData = [
  new Date().toISOString(),
  "",
  "",
  "",
  userId,
  profile.displayName || "",
  profile.pictureUrl || "",
  "WAIT_CID",   // แก้ตรงนี้
  ""
];

    if (index !== -1) {
  
rows[index][4] = userId;
rows[index][5] = profile.displayName || "";
rows[index][6] = profile.pictureUrl || "";

await updateRow(LINE_UID_SHEET, index + 1, rows[index]);
} else {
  await appendRow(LINE_UID_SHEET, rowData);
}

    await safeReply(event, {
      type: "text",
      text: "สวัสดีค่ะ 👋\nกรุณากรอกเลขบัตรประชาชน 13 หลัก (ตัวเลขติดกัน)"
    });


  } catch (err) {

    console.error("handleFollowEvent error:", err);

  }

};


/* =====================================================
   HANDLE CHAT MESSAGE
===================================================== */
exports.handleChatMessage = async (event) => {

  try {
    if (event.type === "message" && event.message.type !== "text") {
      return;
    }

    let payload = "";

    if (event.type === "message") {
      payload = (event.message?.text || "").trim();
    }

    if (event.type === "postback") {
      payload = (event.postback?.data || "").trim();
    }
    if (!event.source || !event.source.userId) {
  console.log("No userId in event");
  return;
}

    const userId = event.source.userId;

    console.log("USER:", userId);
    console.log("PAYLOAD:", payload);
    console.log("Saving chat log to sheet...");

    /* ===== บันทึก Chat Log ===== */

    await appendRow(USER_SHEET, [
  new Date().toISOString(),
  userId,
  payload
]);

/* ===== REGISTER FLOW ===== */

const rows = await readRows(LINE_UID_SHEET);

const index = rows.findIndex((r,i) =>
  i > 0 && String(r[4] || "").trim() === userId
);

if (index !== -1) {

  const status = String(rows[index][7] || "").trim();

  /* ===== WAIT CID ===== */
if (status === "WAIT_CID") {

payload = payload.replace(/\D/g,"");

if (!/^\d{13}$/.test(payload)) {
    return safeReply(event,{
      type:"text",
      text:"กรุณากรอกเลขบัตรประชาชน 13 หลัก"
    });

  }

  const cidIndex = rows.findIndex((r,i) =>
    i > 0 && String(r[1] || "").trim() === payload
  );

  if (cidIndex !== -1) {

  console.log("CID already exists → update LINE UID");

  rows[cidIndex][4] = userId;
  rows[cidIndex][5] = rows[index][5];
  rows[cidIndex][6] = rows[index][6];
  rows[cidIndex][7] = "ACTIVE";

  await updateRow(LINE_UID_SHEET, cidIndex + 1, rows[cidIndex]);

  if (index !== cidIndex) {
  await deleteRow(LINE_UID_SHEET, index + 1);
}

  return safeReply(event,{
    type:"text",
    text:"เชื่อมต่อ LINE กับข้อมูลผู้ป่วยเรียบร้อยแล้วค่ะ ✅"
  });

}

  rows[index][1] = payload;
  rows[index][7] = "WAIT_NAME";

  await updateRow(LINE_UID_SHEET,index+1,rows[index]);

  return safeReply(event,{
  type:"text",
  text:"กรุณากรอกชื่อและนามสกุล\nตัวอย่าง: สมชาย ใจดี"
});

}



if (status === "WAIT_NAME") {

  const parts = payload.split(" ");

  if (parts.length < 2) {

    return safeReply(event,{
      type:"text",
      text:"กรุณากรอกแบบ: ชื่อ นามสกุล\nตัวอย่าง: สมชาย ใจดี"
    });

  }

  const name = parts[0].trim();
  const lname = parts.slice(1).join(" ").trim();

  rows[index][2] = name;
  rows[index][3] = lname;
  rows[index][7] = "ACTIVE";

  await updateRow(LINE_UID_SHEET,index+1,rows[index]);

  return safeReply(event,{
    type:"text",
    text:"ลงทะเบียนสำเร็จแล้วค่ะ 🎉"
  });

}
    /* ===== CONFIRM RESULT ===== */

    if (payload.startsWith("CONFIRM_RESULT:")) {

      const nsr = payload.split(":")[1]?.trim();

      console.log("CONFIRM NSR:", nsr);

      const record = await nursingService.getByNSR(nsr);

      if (!record) {

        await safeReply(event,{
          type:"text",
          text:"❌ ไม่พบข้อมูลผลตรวจ"
        });

        return;
      }

      if (record.ResultConfirmed === "YES") {

        await safeReply(event,{
          type:"text",
          text:"ℹ️ ระบบบันทึกการยืนยันไว้แล้วค่ะ"
        });

        return;
      }

      await nursingService.markResultConfirmed(nsr);

      await safeReply(event,{
        type:"text",
        text:"✅ ระบบบันทึกการยืนยันการรับผลตรวจเรียบร้อยแล้ว ขอบพระคุณค่ะ 🙏"
      });

      return;

    }
  }

  } catch (err) {

    console.error("handleChatMessage error:", err);

    try {

      await safeReply(event,{
        type:"text",
        text:"❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      });

    } catch {}

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

  const userId = String(userRow[4] || "").trim();

  if (!userId) {
    throw new Error("LINE userId not found");
  }
  if (!userId || userId === "undefined") {

  console.log("⚠️ Skip push → invalid userId");

  return false;

}

try {

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

} catch(err){

  console.error("LINE PUSH ERROR:", err.message);

}
  return true;

};


/* =====================================================
   CONFIRM RESULT
===================================================== */
exports.confirmResult = async (nsr) => {

  console.log("Confirm result:", nsr);

  await nursingService.markResultConfirmed(nsr);

};


/* =====================================================
   HANDLE UNFOLLOW
===================================================== */
exports.handleUnfollowEvent = async (event) => {

  try {

    const userId = event.source?.userId;

    console.log("User unfollow:", userId);

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

};

