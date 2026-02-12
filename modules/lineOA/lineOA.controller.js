const lineService = require("./lineOA.service");

exports.handleWebhook = async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
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
