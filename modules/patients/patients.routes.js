/*************************************************
 * modules/patients/patients.routes.js
 *************************************************/
const express = require("express");
const router = express.Router();
const controller = require("./patients.controller");

/* =========================
   PATIENTS API
========================= */
router.post("/import", controller.importPatients);
router.get("/search", controller.searchPatients);


module.exports = router;
