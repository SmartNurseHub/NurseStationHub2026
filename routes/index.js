/*************************************************
 * routes/index.js
 * CENTRAL API ROUTER
 *************************************************/

const express = require("express");
const router = express.Router();

/* ===============================
   HEALTH CHECK
================================ */
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "NurseStationHub API"
  });
});

/* ===============================
   MODULE ROUTES
   (โหลดแบบ SAFE – ไม่พังทั้งระบบ)
================================ */

// 🔹 Dashboard Module
try {
  router.use(
    "/dashboard",
    require("../modules/dashboard/dashboard.routes")
  );
  console.log("✅ Dashboard routes loaded");
} catch (err) {
  console.warn("⚠️ Dashboard routes not loaded yet");
}

// 🔹 Patients Module
try {
  router.use(
    "/patients",
    require("../modules/patients/patients.routes")
  );
  console.log("✅ Patients routes loaded");
} catch (err) {
  console.warn("⚠️ Patients routes not loaded yet");
}

// 🔹 Upload Module
try {
  router.use(
    "/upload",
    require("../modules/upload/upload.routes")
  );
  console.log("✅ Upload routes loaded");
} catch (err) {
  console.warn("⚠️ Upload routes not loaded yet");
}

// 🔹 Appointments Module
try {
  router.use(
    "/appointments",
    require("../modules/appointments/appointments.routes")
  );
  console.log("✅ Appointments routes loaded");
} catch (err) {
  console.warn("⚠️ Appointments routes not loaded yet");
}

module.exports = router;
