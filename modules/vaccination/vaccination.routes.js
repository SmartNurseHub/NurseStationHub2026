const express = require("express");
const router = express.Router();
const controller = require("./vaccination.controller");

router.get("/timeline/:cid", controller.timeline);

router.get("/latest/:cid", controller.latest);

router.get("/history/:cid", controller.history);

router.get("/master", controller.getVaccineMaster);

router.get("/next-vcn", controller.getNextVCN);

router.post("/add", controller.addVaccination);

router.get("/appointments/:cid", controller.getAppointments);

router.delete("/delete/:vcn", controller.deleteVaccination); // ⭐ แก้ตรงนี้

router.post("/send-line/:vcn", controller.sendLineVaccine);

module.exports = router;