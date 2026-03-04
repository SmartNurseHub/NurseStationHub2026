const axios = require("axios");

const LINE_API = "https://api.line.me/v2/bot";

const client = axios.create({
  baseURL: LINE_API,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
  }
});


/* =====================================================
   GET PROFILE
===================================================== */
exports.getProfile = async (userId) => {
  const res = await client.get(`/profile/${userId}`);
  return res.data;
};

/* =====================================================
   REPLY MESSAGE
===================================================== */
exports.replyMessage = async (replyToken, message) => {
  await client.post("/message/reply", {
    replyToken,
    messages: [message]
  });
};

/* =====================================================
   PUSH FLEX RESULT (UI แบบภาพแรก)
===================================================== */
exports.pushFlexResult = async ({
  userId,
  nsr,
  fullName,
  dateService,
  list,
  result,
  advice,
  status
}) => {

  const flex = {type: "flex",altText: "แจ้งผลการตรวจ",
    contents: {type: "bubble",size: "mega",
      /* ================= HERO IMAGE ================= */
      hero: {type: "image",url: "https://drive.google.com/uc?export=view&id=1O366lb3XphBKeVv51F5nNHIOEvdEh-jI", 
        size: "full",aspectRatio: "20:13",aspectMode: "cover"},
      /* ================= BODY ================= */
      body: {type: "box",layout: "vertical",spacing: "md",
        contents: [
          {type: "text",text: "📋 แจ้งผลการตรวจ 📋",weight: "bold",size: "xl",color: "#1B5E20",align: "center"},

          {type: "separator"},

          {type: "text",text: fullName,weight: "bold",size: "xl",color: "#0D47A1",align: "center"},

          {type: "box",layout: "vertical",margin: "md",spacing: "sm",
        contents: [
          {type: "text",text: "รายการตรวจ",weight: "bold"},
         
          {type: "text",text: list || "-",wrap: true},
          
          {type: "text",text: "วันที่ตรวจ",weight: "bold",margin: "md"},
          
          {type: "text",text: dateService || "-"},

          {type: "text",text: "ผลตรวจ",weight: "bold",margin: "md"},
              
          {type: "text",text: result || "-",wrap: true,color: "#2E7D32"},

          {type: "text",text: "คำแนะนำ",weight: "bold",margin: "md"},
              
          {type: "text",text: advice || "-",wrap: true},

          {type: "text",text: "สถานะ",weight: "bold",margin: "md"},
          
          {type: "text",text: status || "ACTIVE",color: "#1976D2",weight: "bold"}]

          }
        ]
      },

      /* ================= FOOTER BUTTONS ================= */
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
              label: "✅ ยืนยันรับผลแล้ว",
              text: `CONFIRM_RESULT:${nsr}`
            }
          },

          {
            type: "button",
            style: "secondary",
            action: {
              type: "uri",
              label: "⭐ ประเมินความพึงพอใจ",
              uri: "https://yourdomain.com/satisfaction"
            }
          }
        ]
      }
    }
  };

  await client.post("/message/push", {
    to: userId,
    messages: [flex]
  });
};