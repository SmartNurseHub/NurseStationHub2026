/******************************************************************
 * LINE OA SERVICE
 * push result via LINE
 ******************************************************************/

const line = require("@line/bot-sdk");
const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const { formatBullet } = require("../../utils/flexBuilder");

/* 🔧 FIX: เรียก nursing service */
const nursingService = require("../nursingRecords/nursingRecords.service");

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
/* =================================================
   PUSH FLEX RESULT
================================================= */

exports.pushFlexResult = async ({
  userId,
  nsr,
  fullName,
  dateService,
  list,
  result,
  advice,
  fileURL
}) => {

  if (!userId) {
  console.log("⚠️ LINE userId not found");
  return;
}

  /* ================= RESULT TRIAGE COLOR ================= */

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

  /* ================= FORMAT TEXT ================= */

  const listLines = formatBullet(list || []).slice(0, 10);
  const resultLines = formatBullet(result || []).slice(0, 10);
  const adviceLines = formatBullet(advice || []).slice(0, 10);

  /* ================= FLEX BODY ================= */

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

    /* ---------- TEST LIST ---------- */

    {
      type: "text",
      text: "📄 รายการตรวจ",
      weight: "bold",
      color: "#0288D1",
      size: "lg"
    },

    { type: "separator", margin: "md" },

    ...listLines.map(t => ({
      type: "text",
      text: t,
      size: "sm",
      wrap: true
    })),

    { type: "separator", margin: "md" },

    /* ---------- SERVICE DATE ---------- */

    {
      type: "box",
      layout: "vertical",
      margin: "md",
      spacing: "xs",
      contents: [

        {
          type: "text",
          text: "📅 วันที่ตรวจ",
          weight: "bold",
          color: "#0288D1",
          size: "lg"
        },

        { type: "separator", margin: "sm" },

        {
          type: "text",
          text: dateService || "-",
          size: "sm",
          color: "#555555"
        }

      ]
    },

    { type: "separator", margin: "md" },

    /* ---------- RESULT ---------- */

    {
      type: "text",
      text: "📊 ผลตรวจ",
      weight: "bold",
      color: "#0288D1",
      size: "lg"
    },

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

    /* ---------- ADVICE ---------- */

    {
      type: "text",
      text: "💡 คำแนะนำจากพยาบาล",
      weight: "bold",
          color: "#0288D1",
          size: "lg"
    },

    { type: "separator", margin: "md" },

    ...adviceLines.map(t => ({
      type: "text",
      text: t,
      wrap: true,
      size: "sm"
    }))

  ];

  /* ================= FILE ATTACHMENT ================= */

  if (fileURL) {

    contents.push(

      { type: "separator", margin: "lg" },

      {
        type: "button",
        style: "primary",
        color: "#0288D1",
        margin: "md",
        action: {
          type: "uri",
          label: "📎 เปิดไฟล์ผลตรวจ",
          uri: fileURL
        }
      }

    );

  }

  /* ================= FLEX MESSAGE ================= */

  const flex = {

    type: "flex",
    altText: "แจ้งผลการตรวจสุขภาพ",

    contents: {

      type: "bubble",
      size: "mega",

      hero: {
        type: "image",
        url: "https://drive.google.com/uc?export=view&id=1O366lb3XphBKeVv51F5nNHIOEvdEh-jI",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover"
      },

      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents
      },

      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [

          {
            type: "text",
            text: "กรุณากดยืนยันรับผลตรวจ\nและประเมินความพึงพอใจ\nเพื่อเป็นข้อมูลในการปรับปรุง\nบริการให้ดียิ่งขึ้น",
            align: "center",
            size: "sm",
            margin: "sm",
            color: "#0D47A1",
            wrap: true
          },

          {
            type: "button",
            style: "primary",
            color: "#2E7D32",
            action: {
              type: "message",
              label: "✅ ยืนยันรับผลแล้ว",
              text: `CONFIRM_RESULT:${nsr}`
            }
          },

          {
            type: "button",
            style: "secondary",
            color: "#F9A825",
            action: {
              type: "uri",
              label: "⭐ ประเมินความพึงพอใจ",
              uri: "https://liff.line.me/2007902507-7OKhdnNW?nsr=" + nsr
            }
          }

        ]
      }

    }

  };

  /* ================= PUSH ================= */
  let pushSuccess = false;

  try {

  if (!client || !client.pushMessage) {
  console.error("❌ LINE client.pushMessage missing");
  return;
}

pushSuccess = await safePush(userId, flex)

if (!pushSuccess) {
  console.log("⚠️ pushFlexResult skipped:", userId)
  return
}

console.log("✅ pushFlexResult sent:", userId)

} catch (err) {

  const msg = String(err.response?.data?.message || err.message);

  if (msg.includes("not a friend")) {
    console.log("⚠️ user not follow bot:", userId);
    return;
  }

  if (msg.includes("blocked")) {
    console.log("⚠️ user blocked bot:", userId);
    return;
  }

  console.error("❌ pushFlexResult error:", msg);

}

  /* 🔧 FIX สำคัญ — บันทึกว่า LINE ส่งผลแล้ว */

  if (nsr && pushSuccess) {
  try {

    await nursingService.markLineSent(nsr);
      
    console.log("✅ LineSent updated:", nsr);

    } catch (err) {

      console.error("❌ markLineSent failed:", err);

    }

  }

};

/******************************************************************
 * PUSH VACCINE REMINDER
 ******************************************************************/

exports.pushVaccineReminder = async ({
  userId,
  fullName,
  vaccineCode,
  doseNo,
  appointmentDate,
  notifyType
}) => {

  if (!userId) {
  console.log("⚠️ LINE userId not found");
  return;
}

  let icon = "📅";
  let title = "แจ้งเตือนนัดฉีดวัคซีน";

  if (notifyType === "BEFORE_30_DAY") icon = "🗓";
  if (notifyType === "BEFORE_7_DAY") icon = "⏰";
  if (notifyType === "BEFORE_1_DAY") icon = "🔔";
  if (notifyType === "DAY_OF_APPOINTMENT") icon = "🚨";

  const flex = {
    type: "flex",
    altText: "แจ้งเตือนนัดฉีดวัคซีน",

    contents: {
      type: "bubble",
      size: "mega",

      hero: {
        type: "image",
        url: "https://drive.google.com/uc?export=view&id=1O366lb3XphBKeVv51F5nNHIOEvdEh-jI",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover"
      },

      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [

          {
            type: "text",
            text: "💉 ระบบนัดวัคซีน",
            weight: "bold",
            size: "xl",
            align: "center",
            color: "#1B5E20"
          },

          {
            type: "text",
            text: title,
            align: "center",
            size: "md",
            color: "#0D47A1"
          },

          { type: "separator", margin: "md" },

          {
            type: "text",
            text: `👤 ${fullName || "-"}`,
            size: "sm",
            wrap: true
          },

          {
            type: "text",
            text: `💉 วัคซีน: ${vaccineCode || "-"} (เข็มที่ ${doseNo || "-"})`,
            size: "sm"
          },

          {
            type: "text",
            text: `${icon} วันนัด: ${appointmentDate || "-"}`,
            weight: "bold",
            size: "sm"
          },

          { type: "separator", margin: "md" },

          {
            type: "text",
            text: "กรุณามารับบริการตามวันนัด\nหากไม่สะดวกสามารถติดต่อเจ้าหน้าที่",
            size: "sm",
            wrap: true,
            align: "center"
          }

        ]
      },

      footer: {
  type: "box",
  layout: "vertical",
  spacing: "sm",
  contents: [

    {
      type: "button",
      style: "primary",
      color: "#2E7D32",
      action: {
        type: "message",
        label: "✅ ยืนยันว่าจะมารับบริการ",
        text: "CONFIRM_VACCINE_APPOINTMENT"
      }
    },

    {
      type: "button",
      style: "secondary",
      action: {
        type: "uri",
        label: "📅 เลื่อนนัดวัคซีน",
        uri: "https://liff.line.me/2007902507-reschedule?vaccine=HBV"
      }
    },

    {
      type: "button",
      style: "secondary",
      action: {
        type: "uri",
        label: "📜 เปิดประวัติวัคซีน",
        uri: "https://liff.line.me/2007902507-vaccine-history"
      }
    },

    {
      type: "button",
      style: "secondary",
      action: {
        type: "uri",
        label: "🏥 Check-in ก่อนมาถึง",
        uri: "https://liff.line.me/2007902507-checkin"
      }
    },

    {
      type: "button",
      style: "secondary",
      action: {
        type: "uri",
        label: "📍 เปิดแผนที่คลินิก",
        uri: "https://maps.app.goo.gl/HAu5GbXGviYF4VXd8"
      }
    },

    {
      type: "button",
      style: "secondary",
      action: {
        type: "uri",
        label: "☎️ โทร 038-068952",
        uri: "tel:038068952"
      }
    }

  ]
}

    }
  };
try {

  if (!client || !client.pushMessage) {
  console.error("❌ LINE client.pushMessage missing");
  return;
}

const ok = await safePush(userId, flex)

if (!ok) {
  console.log("⚠️ pushVaccineReminder skipped:", userId)
  return
}

console.log("✅ pushVaccineReminder sent:", userId)


} catch (err) {

  const msg = String(err.response?.data?.message || err.message);

  if (msg.includes("not a friend")) {
    console.log("⚠️ user not follow bot:", userId);
    return;
  }

  if (msg.includes("blocked")) {
    console.log("⚠️ user blocked bot:", userId);
    return;
  }

  console.error("❌ pushVaccineReminder error:", msg);

}

};

exports.getProfile = async (userId) => {

  try {

    return await client.getProfile(userId);

  } catch (err) {

    const msg = String(err.response?.data?.message || err.message);

    console.log("⚠️ getProfile failed:", msg);

    return null;

  }

};

/******************************************************************
 * REPLY MESSAGE
 * ใช้ตอบ webhook message
 ******************************************************************/

exports.replyMessage = async (replyToken, message) => {

  if (!replyToken) {
    console.log("⚠️ replyToken missing");
    return;
  }

  try {

    const messages = Array.isArray(message) ? message : [message];

    await client.replyMessage(replyToken, messages);

    console.log("✅ reply sent");

  } catch (err) {

    const msg = String(err.response?.data?.message || err.message);

    if (msg.includes("Invalid reply token") || msg.includes("reply token")) {
      console.log("⚠️ replyToken expired");
      return;
    }

    console.error("❌ replyMessage error:", msg);

  }

};

/******************************************************************
 * PUSH SIMPLE MESSAGE
 ******************************************************************/

exports.pushMessage = async (userId, message) => {

  if (!userId) {
    console.log("⚠️ pushMessage userId missing");
    return false;
  }

  const messages = Array.isArray(message) ? message : [message];

  const ok = await safePush(userId, messages);

  if (ok) {
    console.log("✅ pushMessage sent:", userId);
  }

  return ok;

};