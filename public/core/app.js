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
      <div class="alert alert-danger">
        ❌ ไม่พบหน้า <b>${name}</b>
      </div>
    `;
    return;
  }

  try {
    console.log("🔄 Load view:", name);

    /* ---------- 1. LOAD HTML ---------- */
    const res = await fetch(cfg.view);
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
          window[cfg.init]();
        }
      };

      document.body.appendChild(s);
      currentScript = s;
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="alert alert-danger">
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
  loadView(nav.dataset.nav);
});

/* ===============================
   INIT
================================ */
window.addEventListener("DOMContentLoaded", () => {
  loadView("dashboard");
});
