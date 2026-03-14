const express = require("express");
const router = express.Router();
const controller = require("./lineUID.controller");

router.get("/", controller.getLineUID);

router.post("/save", controller.addLineUID);

router.delete("/delete/:cid", controller.deleteLineUID);

module.exports = router;