/*************************************************
 * modules/dashboard/dashboard.controller.js
 * DASHBOARD CONTROLLER
 *************************************************/

const {
  getDashboardSummaryService
} = require("./dashboard.service");

/* =================================================
   GET SUMMARY
================================================= */
async function getDashboardSummary(req, res) {
  try {
    const summary = await getDashboardSummaryService();

    res.json({
      success: true,
      data: summary
    });

  } catch (err) {
    console.error("❌ dashboard summary error:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = {
  getDashboardSummary
};
