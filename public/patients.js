const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patients.controller");

router.post("/upsert", patientController.upsertPatient);

module.exports = router;
