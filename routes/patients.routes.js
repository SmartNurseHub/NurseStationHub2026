/******************************************************************
 * routes/patients.routes.js
 * UPLOAD ONLY — SAFE
 ******************************************************************/
"use strict";

const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const controller = require("../controllers/patients.controller");

/* ================= UPLOAD ================= */
/**
 * field name = "file"
 */
router.post(
  "/upload",
  upload.single("file"),
  controller.uploadPatients
);

module.exports = router;
