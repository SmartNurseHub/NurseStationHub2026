/******************************************************************
 * routes/nursing.routes.js
 ******************************************************************/
const express = require("express");
const router = express.Router();
const nursingController = require("../controllers/nursing.controller");

/* =========================================================
 * GET /api/nursing
 * โหลดบันทึกการพยาบาล
 * ======================================================= */
router.get("/", nursingController.listNursingRecords);

module.exports = router;
