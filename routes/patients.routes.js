/******************************************************************
 * routes/patients.routes.js
 * PATIENT UPLOAD (NO SSE)
 ******************************************************************/
"use strict";

const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const controller = require("../controllers/patients.controller");

/* =========================================================
   UPLOAD PATIENTS
   POST /api/patients/upload
   field name = "file"
========================================================= */
router.post(
  "/upload",
  upload.single("file"),
  controller.uploadPatients
);

module.exports = router;
