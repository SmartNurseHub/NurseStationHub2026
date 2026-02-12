const lineService = require("./lineOA.service");
const { readRows } = require("../../config/google");
const { FOLLOW_SHEET, USER_SHEET } = require("./lineOA.schema");

// webhook (เดิม)
exports.handleWebhook = async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type === "follow" || event.type === "unfollow") {
        await lineService.handleFollowEvent(event);
      }

      if (event.type === "message" && event.message.type === "text") {
        await lineService.handleChatMessage(event);
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("LINE webhook error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔥 READ FOLLOW LIST
exports.getFollowList = async (req, res) => {
  try {
    const rows = await readRows(FOLLOW_SHEET);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    console.log("📩 LINE webhook received");
    console.log(JSON.stringify(req.body, null, 2));

    const events = req.body.events || [];

    for (const event of events) {
      console.log("➡️ event type:", event.type);

      switch (event.type) {
        case "follow":
        case "unfollow":
          await lineService.handleFollowEvent(event);
          break;

        case "message":
          if (event.message.type === "text") {
            await lineService.handleChatMessage(event);
          }
          break;
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("LINE webhook error:", err);
    res.status(500).json({ error: err.message });
  }
};


// 🔥 READ CHAT LOG
exports.getUserMessages = async (req, res) => {
  try {
    const rows = await readRows(USER_SHEET);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
