const line = require("@line/bot-sdk");
const { appendRow, readRows } = require("../../config/google");

const registrationService = require("./lineOA.registration.service");

const FOLLOW_SHEET = "FollowList";
const USER_SHEET = "UserList";
const UID_SHEET = "LineUID";

exports.handleWebhook = async (req, res) => {

  const events = req.body.events || [];

  const client = new line.Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
  });

  res.sendStatus(200);

  for (const event of events) {

    try {

      console.log("📩 EVENT:", JSON.stringify(event));

      const userId = event.source?.userId;

      if (!userId) continue;

      const now = new Date().toISOString();

      /* =====================================================
         HELPER: CHECK USER EXIST
      ===================================================== */
      const isUserExist = async () => {
        const rows = await readRows(UID_SHEET);
        return rows.some((r, i) => i > 0 && r[4] === userId);
      };


      /* =====================================================
         1. FOLLOW
      ===================================================== */
      if (event.type === "follow") {

        const profile = await client.getProfile(userId);

        await appendRow(FOLLOW_SHEET, [
          now,
          "follow",
          userId,
          profile.displayName,
          profile.pictureUrl
        ]);

        // ✅ กันซ้ำ
        const exists = await isUserExist();

        if (!exists) {

          await appendRow(UID_SHEET, [
            now,
            "",
            "",
            "",
            userId,
            profile.displayName,
            profile.pictureUrl,
            "PENDING_CID",
            ""
          ]);

        }

        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "ยินดีต้อนรับ 🙏 กรุณากรอกเลขบัตรประชาชน 13 หลัก"
        });

        continue;
      }


      /* =====================================================
         2. UNFOLLOW
      ===================================================== */
      if (event.type === "unfollow") {

        await appendRow(FOLLOW_SHEET, [
          now,
          "unfollow",
          userId,
          "",
          ""
        ]);

        continue;
      }


      /* =====================================================
         3. MESSAGE
      ===================================================== */
      if (event.type === "message" && event.message.type === "text") {

        const text = event.message.text;

        // ✅ log chat (กันพัง)
        try {
          await appendRow(USER_SHEET, [now, userId, text]);
        } catch (e) {
          console.error("Chat log error:", e.message);
        }

        // ✅ ถ้ายังไม่มี user → สร้างทันที
        const exists = await isUserExist();

        if (!exists) {

          const profile = await client.getProfile(userId);

          await appendRow(UID_SHEET, [
            now,
            "",
            "",
            "",
            userId,
            profile.displayName,
            profile.pictureUrl,
            "PENDING_CID",
            ""
          ]);

          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก"
          });

          continue;
        }

        // ✅ เข้า flow
        const handled = await registrationService.handleRegistrationFlow(
          client,
          userId,
          text,
          event.replyToken
        );

        if (handled) continue;

        // ✅ fallback
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "พิมพ์ 'สมัคร' เพื่อเริ่มลงทะเบียน"
        });

      }

    } catch (err) {

      console.error("❌ EVENT ERROR:", err);

    }
  }

};

/* =========================================================
   REPORT
========================================================= */

exports.sendResultByNSR = async (req, res) => {
  try {
    res.json({ ok: true, message: "sendResultByNSR working" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================
   DATA
========================================================= */

exports.getFollowList = async (req, res) => {
  try {
    const rows = await readRows(FOLLOW_SHEET);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserMessages = async (req, res) => {
  try {
    const rows = await readRows(USER_SHEET);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};