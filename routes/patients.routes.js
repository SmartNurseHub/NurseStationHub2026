const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const controller = require("../controllers/patients.bulk.controller");

router.post("/bulk", upload.single("file"), controller.bulkUpsert);

module.exports = router;
