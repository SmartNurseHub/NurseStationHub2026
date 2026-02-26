/*************************************************
 * modules/patients/patients.routes.js
 *************************************************/
const express = require("express");
const router = express.Router();
const controller = require("./patients.controller");

/* =========================
   PATIENTS API
========================= */
router.get("/", controller.getPatientsList); // ⭐ เพิ่มบรรทัดนี้
router.post("/import", controller.importPatients);
router.get("/search", controller.searchPatients);
router.get("/list", controller.getPatientsList);
module.exports = router;
