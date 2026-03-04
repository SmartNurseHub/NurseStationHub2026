const service = require("./lineOA.service");
const { readRows } = require("../../config/google");
const { FOLLOW_SHEET, USER_SHEET } = require("./lineOA.schema");
const registrationService = require("./lineOA.registration.service");
/* =================================================
   LINE WEBHOOK
================================================= */
exports.handleWebhook = (req, res) => {
  console.log("📩 LINE webhook received");

  res.status(200).send("OK");

  setImmediate(async () => {
    try {
      const events = req.body.events || [];

      for (const event of events) {
        if (event.type === "follow") {
          await service.handleFollowEvent(event);
        }

        if (event.type === "message" && event.message?.type === "text") {
          await service.handleChatMessage(event);
        }
      }

    } catch (err) {
      console.error("Webhook background error:", err);
    }
  });
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

