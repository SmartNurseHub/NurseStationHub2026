/*************************************************
 * modules/dashboard/dashboard.client.js
 * DASHBOARD CLIENT SCRIPT
 *************************************************/

(() => {
  console.log("📊 dashboard.client.js loaded");

  /* ===============================
     ELEMENTS
  ================================ */
  const container = document.getElementById("dashboardSummary");

  if (!container) {
    console.warn("dashboard.client.js loaded on non-dashboard page");
    return;
  }

  /* ===============================
     LOAD SUMMARY
  ================================ */
  loadSummary();

  async function loadSummary() {
    try {
      const res = await fetch("/api/dashboard/summary");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Load summary failed");
      }

      renderSummary(data.data);
    } catch (err) {
      console.error("❌ dashboard summary error:", err);
      container.innerHTML =
        `<div class="alert alert-danger">โหลดข้อมูล Dashboard ไม่สำเร็จ</div>`;
    }
  }

  /* ===============================
     RENDER
  ================================ */
  function renderSummary(summary) {
    container.innerHTML = `
      <div class="row g-3">
        <div class="col-md-4">
          <div class="card card-compact p-3 text-center">
            <h6>👥 ผู้รับบริการ</h6>
            <h3>${summary.patients}</h3>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card card-compact p-3 text-center">
            <h6>📅 นัดหมายวันนี้</h6>
            <h3>${summary.appointments}</h3>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card card-compact p-3 text-center">
            <h6>📝 รายงาน</h6>
            <h3>${summary.reports}</h3>
          </div>
        </div>
      </div>
    `;
  }

})();
