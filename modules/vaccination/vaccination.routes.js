/******************************************************************
 * VACCINATION ROUTES
 ******************************************************************/

const express = require("express");
const router = express.Router();
const controller = require("./vaccination.controller");

/* =======================================================
   TIMELINE, LATEST, HISTORY
======================================================= */

router.get("/timeline/:cid", controller.getVaccinationTimeline);
router.get("/latest/:cid", controller.getLatestVaccines);
router.get("/history/:cid", controller.getVaccinationHistory);
/* =======================================================
   VACCINE MASTER & NEXT VCN
======================================================= */
router.get("/master", controller.getVaccineMaster);
router.get("/next-vcn", controller.getNextVCN);

/* =======================================================
   DASHBOARD & SCHEDULE  ⭐ เพิ่มตรงนี้
======================================================= */
router.get("/dashboard", controller.getDashboard);
router.get("/schedule", controller.getSchedule);

/* =======================================================
   APPOINTMENTS  ⭐ (แนะนำให้เพิ่ม)
======================================================= */
router.get("/appointments/:cid", controller.getAppointments);

/* =======================================================
   ADD / DELETE / SEND
======================================================= */
router.post("/add", controller.addVaccination);
router.delete("/delete/:vcn", controller.deleteVaccination);
router.post("/send-line/:vcn", controller.sendLineByButton);
/* =======================================================
   SECURE HISTORY
======================================================= */
router.get("/history-secure/:cid/:lineUID", controller.historySecure);

module.exports = router;