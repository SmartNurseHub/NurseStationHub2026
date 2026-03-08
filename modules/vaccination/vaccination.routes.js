/******************************************************************
 * vaccination.routes.js (FULL VERSION FIXED)
 ******************************************************************/

const router = require("express").Router();
const ctrl = require("./vaccination.controller");


/* =====================================================
   VACCINE MASTER
===================================================== */

router.get("/master", ctrl.getVaccineMaster);


/* =====================================================
   PATIENT
===================================================== */

router.get("/patient/:cid", ctrl.getPatient);


/* =====================================================
   VACCINATION RECORD
===================================================== */

router.get("/cid/:cid", ctrl.getVaccinationByCID);


/* =====================================================
   TIMELINE
===================================================== */

router.get("/timeline/:cid", ctrl.getVaccinationTimeline);


/* =====================================================
   ⭐ LATEST VACCINE (ADD THIS)
===================================================== */

router.get("/latest/:cid", ctrl.getLatestVaccines);


/* =====================================================
   ⭐ VACCINATION HISTORY (ADD THIS)
===================================================== */

router.get("/history/:cid", ctrl.getVaccinationHistory);


/* =====================================================
   ADD VACCINATION
===================================================== */

router.post("/add", ctrl.addVaccination);


/* =====================================================
   CERTIFICATE
===================================================== */

router.get("/certificate/:cid", ctrl.exportCertificate);


module.exports = router;