const express = require("express");
const router = express.Router();
const controller = require("./satisfactionSurvey.controller");

router.get("/", controller.renderSurvey);
router.post("/submit", controller.submitSurvey);

module.exports = router;
