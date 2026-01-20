/*************************************************
 * modules/dashboard/dashboard.service.js
 * DASHBOARD SERVICE
 *************************************************/

/* =================================================
   SUMMARY SERVICE
================================================= */
async function getDashboardSummaryService() {
  // 🔧 mock data (เปลี่ยนเป็น DB / Sheet ภายหลัง)
  return {
    patients: 128,
    appointments: 24,
    reports: 6
  };
}

module.exports = {
  getDashboardSummaryService
};
