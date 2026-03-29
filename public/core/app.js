/*************************************************
 * public/core/app.js
 * SPA CORE — MODULE-BASED (FINAL CLEAN)
 *************************************************/

let currentScript = null;
const loadedScripts = new Map(); 
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
  script: "/modules/nursingRecords/nursingRecords.client.js"
},

   /* ⭐ NEW */
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
  /* ✅ ADD THIS */
  vaccination: {
    view: "/modules/vaccination/vaccination.view.html",
    script: "/modules/vaccination/vaccination.client.js",
    init: "initVaccination"
  }
};

/* ===============================
   LOAD VIEW
================================ */
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

    /* ---------- 2. LOAD SCRIPT (SAFE) ---------- */
    if (cfg.script) {

      let scriptPromise = loadedScripts.get(cfg.script);

      if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = cfg.script;
          s.defer = true;

          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Script load failed: " + cfg.script));

          document.body.appendChild(s);
        });

        loadedScripts.set(cfg.script, scriptPromise);
      }

      await scriptPromise;

      if (cfg.init && typeof window[cfg.init] === "function") {
        window[cfg.init]();
        console.log(`✅ Init ${cfg.init}()`);
      }
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
   OPEN NURSING COUNSELOR FORM
   ใช้ร่วมทุก module
================================ */
window.openNursingCounselor = function (tab = "general") {

  loadView("nursingCounselor");

  setTimeout(() => {

    // เปิด tab
    const tabBtn = document.querySelector(
      `button[data-bs-target="#${tab}"]`
    );

    if (tabBtn && window.bootstrap) {
      bootstrap.Tab.getOrCreateInstance(tabBtn).show();
    }

    // scroll ไปที่ form
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
