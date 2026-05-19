/*************************************************
 * SPA CORE — MODULE-BASED (HARDENED VERSION)
 *************************************************/

const loadedScripts = new Map();

/* ===============================
   SIDEBAR
================================ */
function toggleSidebar() {
  document.body.classList.toggle("sidebar-collapsed");
}

/* ===============================
   VIEW CONFIG
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

  nursingCounselor: {
    view: "/modules/nursingCounselor/nursingCounselor.view.html",
    script: "/modules/nursingCounselor/nursingCounselor.client.js",
    init: "initNursingCounselor"
  },

  reports: {
    view: "/modules/reports/reports.view.html",
    script: "/modules/reports/reports.client.js",
    init: "initReports"
  },

 vaccination: {
  view: "/modules/vaccination/vaccination.view.html",
  scripts: [
    "/modules/vaccination/vaccination.state.js",   // ✅ STATE
    "/modules/vaccination/vaccination.api.js",     // ✅ API
    "/modules/vaccination/vaccination.ui.js",      // 🔥 UI (ตัวที่หาย)
    "/modules/vaccination/vaccination.events.js",  // ✅ EVENTS
    "/modules/vaccination/vaccination.client.js"   // ✅ CLIENT
  ],
  init: "initVaccination"
},
  inventory: {
  view: "/modules/inventory/inventory.view.html",
  script: "/modules/inventory/inventory.client.js",
  init: "initInventory"
}
};

/* ===============================
   LOAD VIEW
================================ */
async function loadView(name) {
  const cfg = VIEW_CONFIG[name];
  const container = document.getElementById("view-container");

  if (!cfg) return;

  try {
    const res = await fetch(cfg.view);
    const html = await res.text();
    container.innerHTML = html;

    const scripts = cfg.scripts || (cfg.script ? [cfg.script] : []);

    for (const src of scripts) {
      let scriptPromise = loadedScripts.get(src);

      if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = src;
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });

        loadedScripts.set(src, scriptPromise);
      }

      await scriptPromise;
    }

    if (cfg.init && window[cfg.init]) {
      await window[cfg.init]();
    }

  } catch (err) {
    console.error(err);
  }
}

/* ===============================
   NAV
================================ */
document.addEventListener("click", e => {
  const nav = e.target.closest("[data-nav]");
  if (!nav) return;

  e.preventDefault();
  loadView(nav.dataset.nav);
});

/* ===============================
   INIT
================================ */
window.addEventListener("DOMContentLoaded", () => {
  loadView("dashboard");
});