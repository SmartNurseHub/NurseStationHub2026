const express = require("express");
const router = express.Router();

const controller = require("./vaccination.controller");

router.get("/master", controller.getVaccineMaster);
router.get("/next-vcn", controller.getNextVCN);
router.post("/save", controller.addVaccination);
router.get("/latest", controller.getLatestVaccination);
console.log(controller);
module.exports = router;