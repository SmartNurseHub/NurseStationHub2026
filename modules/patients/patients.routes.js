/*************************************************
 * modules/patients/patients.routes.js
 * PATIENTS ROUTES (CLEAN)
 *************************************************/

const express = require("express");
const router = express.Router();

const {
  importPatients,
} = require("./patients.controller");

/* =================================================
   POST /api/patients/import
   → Import patients (HN-based)
================================================= */
router.post("/import", importPatients);

module.exports = router;
