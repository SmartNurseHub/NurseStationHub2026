/*************************************************
 * routes/index.js
 * CENTRAL API ROUTER (SAFE & SCALABLE)
 *************************************************/

const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "NurseStationHub API",
    time: new Date().toISOString()
  });
});
router.use(
  "/nursingRecords",
  require("../modules/nursingRecords/nursingRecords.routes")
);
/* ===============================
   MODULE ROUTES
================================ */

function safeUse(path, modulePath, name) {
  try {
    router.use(path, require(modulePath));
    console.log(`✅ ${name} routes loaded`);
  } catch (err) {
    console.error(`❌ ${name} routes FAILED`);
    console.error(err.message);
  }
}

safeUse("/dashboard", "../modules/dashboard/dashboard.routes", "Dashboard");
safeUse("/patients", "../modules/patients/patients.routes", "Patients");
safeUse("/upload", "../modules/upload/upload.routes", "Upload");
safeUse("/appointments", "../modules/appointments/appointments.routes", "Appointments");
safeUse("/nursingRecords", "../modules/nursingRecords/nursingRecords.routes", "NursingRecords");
safeUse("/lineOA", "../modules/lineOA/lineOA.routes", "LineOA");
safeUse("/line", "../modules/lineOA/lineOA.routes", "LineOA(alias)");

module.exports = router;
