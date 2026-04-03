/******************************************************************
 * LINE OA SERVICE MODULE
 * NurseStationHub
 *****************************************************************/

const line = require("@line/bot-sdk");

const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const { formatBullet } = require("../../utils/flexBuilder");
const nursingService = require("../nursingRecords/nursingRecords.service");


/* =========================================================
   CORE: SAFE PUSH (ของเดิมคุณ 100%)
========================================================= */
async function safePush(userId, message) {

  if (!userId || !message) {
    console.log("⚠️ safePush invalid params");
    return false;
  }

  if (!client || !client.pushMessage) {
    console.error("❌ LINE client.pushMessage missing");
    return false;
  }

  const messages = Array.isArray(message) ? message : [message];

  try {

    await new Promise(r => setTimeout(r, 120));

    await Promise.race([
      client.pushMessage(userId, messages),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("LINE timeout")), 8000)
      )
    ]);

    return true;

  } catch (err) {

    const msg = String(err.response?.data?.message || err.message);

    if (msg.includes("not a friend") || msg.includes("blocked")) {
      console.log("⚠️ user cannot receive:", userId);
      return false;
    }

    console.log("⚠️ retry push:", userId);

    try {

      await client.pushMessage(userId, messages);
      return true;

    } catch (err2) {

      const msg2 = err2.response?.data?.message || err2.message;
      console.error("❌ push error:", msg2);

      return false;

    }

  }

}


/* =========================================================
   RESULT: PUSH HEALTH RESULT (ของเดิมคุณ 100%)
========================================================= */
async function pushFlexResult({
  userId,
  nsr,
  fullName,
  dateService,
  list,
  result,
  advice,
  fileURL
}) {

  if (!userId) {
    console.log("⚠️ LINE userId not found");
    return;
  }

  let resultColor = "#2E7D32";
  let resultIcon = "🟢";

  if (result) {

    const lower = Array.isArray(result)
      ? result.join(" ").toLowerCase()
      : String(result).toLowerCase();

    if (lower.includes("ปกติ")) {
      resultColor = "#2E7D32";
      resultIcon = "🟢";
    }

    else if (lower.includes("ติดตาม") || lower.includes("เสี่ยง")) {
      resultColor = "#FF6600";
      resultIcon = "🟡";
    }

    else if (
      lower.includes("ผิดปกติ") ||
      lower.includes("พบ") ||
      lower.includes("เชื้อ")
    ) {
      resultColor = "#C62828";
      resultIcon = "🔴";
    }

  }

  const listLines = formatBullet(list || []).slice(0, 10);
  const resultLines = formatBullet(result || []).slice(0, 10);
  const adviceLines = formatBullet(advice || []).slice(0, 10);

  const contents = [
    {
      type: "text",
      text: "📋 ผลการตรวจสุขภาพ",
      weight: "bold",
      size: "xl",
      align: "center",
      color: "#1B5E20"
    },
    {
      type: "text",
      text: fullName || "-",
      align: "center",
      size: "lg",
      margin: "sm",
      color: "#0D47A1"
    },
    { type: "separator", margin: "md" },

    {
      type: "text",
      text: "📄 รายการตรวจ",
      weight: "bold"
    },

    { type: "separator", margin: "md" },

    ...listLines.map(t => ({
      type: "text",
      text: t,
      size: "sm",
      wrap: true
    })),

    { type: "separator", margin: "md" },

    {
      type: "text",
      text: `${resultIcon} สรุปผล`,
      weight: "bold",
      size: "sm",
      color: resultColor
    },

    ...resultLines.map(t => ({
      type: "text",
      text: t,
      wrap: true,
      size: "sm",
      color: resultColor
    })),

    { type: "separator", margin: "md" },

    {
      type: "text",
      text: "💡 คำแนะนำ",
      weight: "bold"
    },

    { type: "separator", margin: "md" },

    ...adviceLines.map(t => ({
      type: "text",
      text: t,
      wrap: true,
      size: "sm"
    }))
  ];

  if (fileURL) {
    contents.push({
      type: "button",
      action: {
        type: "uri",
        label: "📎 เปิดไฟล์",
        uri: fileURL
      }
    });
  }

  const flex = {
    type: "flex",
    altText: "แจ้งผลการตรวจสุขภาพ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents
      }
    }
  };

  let pushSuccess = false;

  try {

    pushSuccess = await safePush(userId, flex);

    if (!pushSuccess) return;

  } catch (err) {
    console.error("❌ push error:", err.message);
  }

  if (nsr && pushSuccess) {
    try {
      await nursingService.markLineSent(nsr);
    } catch (err) {
      console.error("❌ markLineSent failed:", err);
    }
  }
}

async function getProfile(userId) {

  if (!userId) return null;

  try {

    const profile = await client.getProfile(userId);

    return profile;

  } catch (err) {

    console.log("⚠️ getProfile failed:", err.message);
    return null;

  }

}
/* =========================================================
   🔥 FIX จริง (ไม่ตัดอะไรเลย เพิ่มแค่นี้)
========================================================= */
module.exports = {
  safePush,
  getProfile,          
  pushFlexResult
};