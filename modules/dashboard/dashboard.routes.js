/*************************************************
 * modules/dashboard/dashboard.routes.js
 * DASHBOARD ROUTES
 *************************************************/

const express = require("express");
const router = express.Router();

/* ===============================
   GET /api/dashboard/summary
================================ */
router.get("/summary", async (req, res) => {
  try {
    // TODO: ดึงข้อมูลจริงจาก DB
    res.json({
      success: true,
      data: {
        patients: 128,
        appointmentsToday: 5,
        records: 342,
        pending: 3
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Dashboard summary error"
    });
  }
});

module.exports = router;
