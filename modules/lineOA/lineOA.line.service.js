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

  if (!userId) throw new Error("LINE userId not found");

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

  const listLines = formatBullet(list);
  const resultLines = formatBullet(result);
  const adviceLines = formatBullet(advice);

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

  await client.pushMessage(userId, flex);

  /* 🔧 FIX สำคัญ — บันทึกว่า LINE ส่งผลแล้ว */

  if (nsr) {

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

  if (!userId) throw new Error("LINE userId not found");

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

  await client.pushMessage(userId, flex);

};