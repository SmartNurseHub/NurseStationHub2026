const express = require("express");
const router = express.Router();
const controller = require("./dashboard.controller");  // ⭐ เพิ่มบรรทัดนี้

router.get("/summary", controller.getDashboardSummary);
router.get("/followList", controller.getFollowList);
router.post("/followList/update", controller.updateFollow);
router.post("/followList/delete", controller.deleteFollow);

module.exports = router;
