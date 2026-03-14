const service = require("./lineOA.service");
const { readRows } = require("../../config/google");
const { FOLLOW_SHEET, USER_SHEET } = require("./lineOA.schema");
const registrationService = require("./lineOA.registration.service");
const { formatBullet, buildFlex } = require("../../utils/flexBuilder");
/* =================================================
   LINE WEBHOOK
================================================= */
exports.handleWebhook = (req, res) => {

  console.log("📩 LINE webhook received");
  console.log("BODY:", JSON.stringify(req.body, null, 2));

  res.status(200).send("OK");

  setImmediate(async () => {

    try {

      const events = req.body.events || [];

      for (const event of events) {

  if (!event) continue;

  console.log("EVENT TYPE:", event.type);

  try {

    if (event.type === "follow") {
      console.log("FOLLOW USER:", event.source?.userId);
      await service.handleFollowEvent(event);
    }

    if (event.type === "unfollow") {
  console.log("UNFOLLOW USER:", event.source?.userId);
  await service.handleUnfollowEvent(event);
}

    if (event.type === "message" && event.message?.type === "text") {
      console.log("MESSAGE:", event.message.text);
      await service.handleChatMessage(event);
    }

    if (event.type === "postback") {

      const data = event.postback?.data;
      console.log("POSTBACK:", data);

      if (data?.startsWith("CONFIRM_RESULT:")) {

        const nsr = data.replace("CONFIRM_RESULT:", "");

        console.log("CONFIRM NSR:", nsr);

        await service.confirmResult(nsr);
      }

    }

  } catch(err){

    console.error("EVENT ERROR:", err);

  }

}

    } catch (err) {
      console.error("Webhook background error:", err);
    }

  });

};

exports.handleUnfollowEvent = async (event) => {

  try {

    const userId = event.source.userId;

    await appendRow(FOLLOW_SHEET, [
      new Date().toISOString(),
      "unfollow",
      userId,
      "",
      "",
      ""
    ]);

    console.log("User unfollow:", userId);

  } catch (err) {

    console.error("handleUnfollowEvent error:", err);

  }

};

/* =================================================
   SEND RESULT BY NSR
================================================= */
exports.sendResultByNSR = async (req, res) => {
  try {
    const { nsr } = req.body;

    if (!nsr) {
      return res.status(400).json({
        success: false,
        message: "NSR is required"
      });
    }

    await service.sendReport(nsr);

    res.json({ success: true });

  } catch (err) {
    console.error("sendResultByNSR error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* =================================================
   READ FOLLOW LIST
================================================= */
exports.getFollowList = async (req, res) => {
  try {
    const rows = await readRows(FOLLOW_SHEET);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =================================================
   READ CHAT LOG
================================================= */
exports.getUserMessages = async (req, res) => {
  try {
    const rows = await readRows(USER_SHEET);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

