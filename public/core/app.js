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
    script: "/modules/vaccination/vaccination.client.js",
    init: "initVaccination"
  }
};

/* ===============================
   LOAD VIEW (FIXED HARDENED)
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

    /* ---------- 2. LOAD SCRIPT ---------- */
    if (cfg.script) {
      let scriptPromise = loadedScripts.get(cfg.script);

      if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
          const s = document.createElement("script");

          // ⭐ FIX สำคัญ: กันโหลดซ้ำ + debug ง่าย
          s.src = cfg.script + "?v=" + Date.now();
          s.defer = true;

          s.onload = () => {
            console.log("📦 Script loaded:", cfg.script);
            resolve();
          };

          s.onerror = () => {
            console.error("❌ Script load failed:", cfg.script);
            reject();
          };

          document.body.appendChild(s);
        });

        loadedScripts.set(cfg.script, scriptPromise);
      }

      await scriptPromise;

      /* ---------- 3. INIT ---------- */
      if (cfg.init) {
        if (typeof window[cfg.init] === "function") {
          try {
            await window[cfg.init]();
            console.log(`✅ Init ${cfg.init}()`);
          } catch (err) {
            console.error(`❌ Init error (${cfg.init}):`, err);
          }
        } else {
          console.warn(`⚠️ ไม่พบ function ${cfg.init}`);
        }
      }
    }

  } catch (err) {
    console.error("❌ loadView error:", err);

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
   GLOBAL NAV HELPERS
================================ */
window.openNursingCounselor = function (tab = "general") {

  loadView("nursingCounselor");

  setTimeout(() => {
    const tabBtn = document.querySelector(
      `button[data-bs-target="#${tab}"]`
    );

    if (tabBtn && window.bootstrap) {
      bootstrap.Tab.getOrCreateInstance(tabBtn).show();
    }

    const formMap = {
      general: "generalForm",
      disease: "diseaseForm",
      universal: "universalForm"
    };

    const form = document.getElementById(formMap[tab]);
    if (form) {
      form.scrollIntoView({ behavior: "smooth" });
    }

  }, 300);
};

/* ===============================
   INIT
================================ */
window.addEventListener("DOMContentLoaded", () => {
  loadView("dashboard");
});