const express = require("express");
const router = express.Router();
const controller = require("./lineOA.controller");

// LINE Webhook
router.post("/webhook", controller.handleWebhook);

// ✅ SEND RESULT BY NSR (ใช้ body)
router.post("/send-result", controller.sendResultByNSR);

// ✅ ใช้แบบส่ง nsr ทาง body
router.post("/sendReport", controller.sendResultByNSR);
// READ DATA
router.get("/follows", controller.getFollowList);
router.get("/messages", controller.getUserMessages);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "LINE OA OK" });
});

module.exports = router;