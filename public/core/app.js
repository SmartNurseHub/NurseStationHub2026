/*************************************************
 * public/core/app.js
 * SPA CORE — MODULE-BASED (FINAL CLEAN)
 *************************************************/

let currentScript = null;

/* ===============================
   SIDEBAR
================================ */
function toggleSidebar() {
  document.body.classList.toggle("sidebar-collapsed");
}

/* ===============================
   VIEW CONFIG (SOURCE OF TRUTH)
   ➜ เพิ่ม module ที่นี่ที่เดียว
================================ */
const VIEW_CONFIG = {
  dashboard: {
    view: "/modules/dashboard/dashboard.view.html",
    script: "/modules/dashboard/dashboard.client.js",
    init: "initDashboard"
  },

  patients: {
    view: "/modules/patients/patients.view.html",
    script: "/modules/patients/patients.client.js",
    init: "initPatients"
  },

  appointments: {
    view: "/modules/appointments/appointments.view.html",
    script: "/modules/appointments/appointments.client.js",
    init: "initAppointments"
  },

  nursingRecords: {
    view: "/modules/nursingRecords/nursingRecords.view.html",
    script: "/modules/nursingRecords/nursingRecords.client.js",
    init: "initNursingRecords"
  },

  reports: {
    view: "/modules/reports/reports.view.html",
    script: "/modules/reports/reports.client.js",
    init: "initReports"
  }
};

/* ===============================
   LOAD VIEW
================================ */
async function loadView(name) {
  const cfg = VIEW_CONFIG[name];
  const container = document.getElementById("view-container");

  if (!cfg) {
    container.innerHTML = `
      <div class="alert alert-danger m-3">
        ❌ ไม่พบหน้า <b>${name}</b>
      </div>
    `;
    return;
  }

  try {
    console.log("🔄 Load view:", name);

    /* ---------- 1. LOAD HTML ---------- */
    const res = await fetch(cfg.view, { cache: "no-store" });
    if (!res.ok) throw new Error("View not found");

    const html = await res.text();
    container.innerHTML = html;

    /* ---------- 2. REMOVE OLD SCRIPT ---------- */
    if (currentScript) {
      currentScript.remove();
      currentScript = null;
    }

    /* ---------- 3. LOAD CLIENT SCRIPT ---------- */
    if (cfg.script) {
      const s = document.createElement("script");
      s.src = cfg.script;
      s.defer = true;

      s.onload = () => {
        if (cfg.init && typeof window[cfg.init] === "function") {
          try {
            window[cfg.init]();
            console.log(`✅ Init ${cfg.init}()`);
          } catch (err) {
            console.error(`❌ Init ${cfg.init} failed`, err);
          }
        }
      };

      document.body.appendChild(s);
      currentScript = s;
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="alert alert-danger m-3">
        ❌ โหลดหน้า <b>${name}</b> ไม่สำเร็จ
      </div>
    `;
  }
}
/* ===============================
   NAVIGATION (SPA)
================================ */
document.addEventListener("click", e => {
  const nav = e.target.closest("[data-nav]");
  if (!nav) return;

  e.preventDefault();
  const page = nav.dataset.nav;

  loadView(page);
});

/* ===============================
   INIT
================================ */
window.addEventListener("DOMContentLoaded", () => {
  loadView("dashboard");
});
