const express = require("express");
const router = express.Router();
const controller = require("./lineOA.controller");

// LINE Webhook
router.post("/webhook", controller.handleWebhook);

// READ DATA
router.get("/follows", controller.getFollowList);
router.get("/messages", controller.getUserMessages);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "LINE OA OK" });
});

module.exports = router;
