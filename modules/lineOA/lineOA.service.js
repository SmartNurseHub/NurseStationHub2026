/******************************************************************
 * LINE OA SERVICE MODULE (FINAL - PRODUCTION READY)
 *****************************************************************/

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
   CONFIG
========================================================= */

const LINE_UID_SHEET = "LineUID";
const USER_SHEET = "UserList";
const FOLLOW_SHEET = "FollowList";

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

/* =========================================================
   UTILS
========================================================= */

const normalize = (v) => String(v || "").trim();

/**
 * SAFE REPLY
 */
async function safeReply(event, message) {
  if (!event?.replyToken || event.replyToken === "00000000000000000000000000000000") {
    return;
  }
  try {
    await lineClient.replyMessage(event.replyToken, message);
  } catch (err) {
    console.error("LINE REPLY ERROR:", err.message);
  }
}

/* =========================================================
   FOLLOW EVENT
========================================================= */

async function handleFollowEvent(event) {
  try {
    const userId = normalize(event.source?.userId);
    if (!userId) return;

    const profile = await lineAPI.getProfile(userId) || {};
    const rows = await readRows(LINE_UID_SHEET) || [];

    // 🔍 หา row ล่าสุด
    const matched = rows
      .map((r, i) => ({ r, i }))
      .filter(x => x.i > 0 && normalize(x.r[4]) === userId);

    if (matched.length > 0) {
      const { r: row, i: index } = matched[matched.length - 1];

      row[5] = profile.displayName || row[5];
      row[6] = profile.pictureUrl || row[6];

      await updateRow(LINE_UID_SHEET, index + 1, row);

      return safeReply(event, {
        type: "text",
        text: "ยินดีต้อนรับกลับค่ะ 😊"
      });
    }

    // 🔒 กัน append ซ้ำ
    const exists = rows.some((r, i) =>
      i > 0 && normalize(r[4]) === userId
    );

    if (!exists) {
      await appendRow(LINE_UID_SHEET, [
        new Date().toISOString(),
        "",
        "",
        "",
        userId,
        profile.displayName || "",
        profile.pictureUrl || "",
        "WAIT_CID",
        ""
      ]);
    }

    return safeReply(event, {
      type: "text",
      text: "สวัสดีค่ะ 👋\nกรุณากรอกเลขบัตรประชาชน 13 หลัก"
    });

  } catch (err) {
    console.error("handleFollowEvent error:", err);
  }
}

/* =========================================================
   CHAT EVENT
========================================================= */
async function handleChatMessage(event) {
  try {
    const userId = normalize(event.source?.userId);
    if (!userId) return;

    const isText = event.type === "message" && event.message.type === "text";
    const text = isText ? normalize(event.message.text) : "";

    const rows = await readRows(LINE_UID_SHEET) || [];

    // 🔍 หา row ล่าสุดของ user
    const matched = rows
      .map((r, i) => ({ r, i }))
      .filter(x => x.i > 0 && normalize(x.r[4]) === userId);

    const hasUser = matched.length > 0;
    const latest = hasUser ? matched[matched.length - 1] : null;
    const row = latest?.r;
    const index = latest?.i;
    const status = row ? normalize(row[7]).toUpperCase() : null;

    console.log("USER:", userId, "STATUS:", status);

    /* ================= FOLLOW ================= */
    if (event.type === "follow") {

      // ✅ เคยลงทะเบียนแล้ว
      if (status === "ACTIVE") {
        return safeReply(event, {
          type: "text",
          text: "คุณลงทะเบียนแล้วค่ะ ✅"
        });
      }

      // ❌ ยังไม่เคย → สร้าง row ใหม่ + เริ่ม flow
      await appendRow(LINE_UID_SHEET, [
        "", "", "", "", userId, "", "", "WAIT_CID", ""
      ]);

      return safeReply(event, {
        type: "text",
        text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก"
      });
    }

    /* ================= ไม่ใช่ text → ignore ================= */
    if (!isText) return;

    /* ================= ยังไม่มี user ================= */
    if (!hasUser) {
      return safeReply(event, {
        type: "text",
        text: "กรุณากดเพิ่มเพื่อนใหม่อีกครั้งค่ะ"
      });
    }

    /* ================= WAIT_CID ================= */
    if (status === "WAIT_CID") {
      const cid = text.replace(/\D/g, "");

      if (!/^\d{13}$/.test(cid)) {
        return safeReply(event, {
          type: "text",
          text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก"
        });
      }

      const cidIndex = rows.findIndex((r, i) =>
        i > 0 && normalize(r[1]) === cid
      );

      if (cidIndex !== -1) {
        rows[cidIndex][4] = userId;
        rows[cidIndex][7] = "ACTIVE";

        await updateRow(LINE_UID_SHEET, cidIndex + 1, rows[cidIndex]);

        if (index !== cidIndex) {
          await deleteRow(LINE_UID_SHEET, index + 1);
        }

        return safeReply(event, {
          type: "text",
          text: "เชื่อมข้อมูลเรียบร้อยแล้ว ✅"
        });
      }

      row[1] = cid;
      row[7] = "WAIT_NAME";
      await updateRow(LINE_UID_SHEET, index + 1, row);

      return safeReply(event, {
        type: "text",
        text: "กรุณากรอกชื่อ นามสกุล"
      });
    }

    /* ================= WAIT_NAME ================= */
    if (status === "WAIT_NAME") {
      const parts = text.split(/\s+/);

      if (parts.length < 2) {
        return safeReply(event, {
          type: "text",
          text: "กรุณากรอก: ชื่อ นามสกุล"
        });
      }

      row[2] = parts[0];
      row[3] = parts.slice(1).join(" ");
      row[7] = "WAIT_PHONE";

      await updateRow(LINE_UID_SHEET, index + 1, row);

      return safeReply(event, {
        type: "text",
        text: "กรุณากรอกเบอร์โทรศัพท์"
      });
    }

    /* ================= WAIT_PHONE ================= */
    if (status === "WAIT_PHONE") {
      if (!/^0\d{8,9}$/.test(text)) {
        return safeReply(event, {
          type: "text",
          text: "กรุณากรอกเบอร์โทรให้ถูกต้อง"
        });
      }

      row[8] = text;
      row[7] = "ACTIVE";

      await updateRow(LINE_UID_SHEET, index + 1, row);

      return safeReply(event, {
        type: "text",
        text: "ลงทะเบียนสำเร็จแล้ว 🎉"
      });
    }

    /* ================= ACTIVE ================= */
    if (status === "ACTIVE") {

      // ❗ ไม่ใช่ "สมัคร" → เงียบ
      if (text !== "สมัคร") return;

      return safeReply(event, {
        type: "text",
        text: "คุณลงทะเบียนแล้วค่ะ ✅"
      });
    }

  } catch (err) {
    console.error("handleChatMessage error:", err);
  }
}

/* =========================================================
   SEND REPORT
========================================================= */

async function sendReport(nsr) {
  const record = await nursingService.getByNSR(nsr);
  if (!record) throw new Error("ไม่พบ NSR");

  const rows = await readRows(LINE_UID_SHEET);

  const userRow = rows.find(r =>
    normalize(r[1]) === normalize(record.CID) &&
    normalize(r[7]).toUpperCase() === "ACTIVE"
  );

  if (!userRow) throw new Error("ยังไม่ได้ผูก LINE");

  const userId = normalize(userRow[4]);

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
   UNFOLLOW
========================================================= */

async function handleUnfollowEvent(event) {
  try {
    const userId = normalize(event.source?.userId);

    await appendRow(FOLLOW_SHEET, [
      new Date().toISOString(),
      "unfollow",
      userId,
      "",
      "",
      ""
    ]);
  } catch (err) {
    console.error(err);
  }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  lineClient,
  handleFollowEvent,
  handleChatMessage,
  handleUnfollowEvent,
  sendReport
};