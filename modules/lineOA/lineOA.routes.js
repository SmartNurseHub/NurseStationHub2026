const express = require("express");
const router = express.Router();
const controller = require("./lineOA.controller");

// LINE Webhook
router.post("/webhook", controller.handleWebhook);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "LINE OA OK" });
});

module.exports = router;
