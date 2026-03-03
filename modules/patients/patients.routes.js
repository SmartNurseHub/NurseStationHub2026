/*************************************************
 * modules/patients/patients.routes.js
 *************************************************/
const express = require("express");
const router = express.Router();
const controller = require("./patients.controller");

/* =========================
   PATIENTS API
========================= */

// 🔹 List
router.get("/", controller.getPatientsList);
router.get("/list", controller.getPatientsList);
router.get("/search", controller.searchPatients);

// 🔹 Import (Batch from TXT)
router.post("/import", controller.importPatients);

// 🔹 NEW: Manual Create (Google Sheet)
router.post("/create", controller.createPatient);

module.exports = router;