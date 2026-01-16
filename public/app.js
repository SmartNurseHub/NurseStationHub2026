/******************************************************************
 * app.js
 * Smart Nurse Hub 2026
 * SPA Controller (CSP / Production Safe)
 * ✅ Table / DataTable ถูกตัดออกทั้งหมด
 ******************************************************************/

"use strict";

/* =========================
   GLOBAL ELEMENTS
========================= */
const viewContainer = document.getElementById("view-container");
const sidebar = document.getElementById("sidebar");

/* =========================
   SPA NAVIGATION
========================= */
async function navTo(view) {
  if (!viewContainer) return;

  viewContainer.innerHTML = `
    <div class="text-center text-muted py-4">
      ⏳ กำลังโหลด...
    </div>
  `;

  try {
    const res = await fetch(`/views/${view}.html`, {
      headers: { "X-Requested-With": "SPA" }
    });

    if (!res.ok) {
      throw new Error(`View not found: ${view}`);
    }

    const html = await res.text();
    viewContainer.innerHTML = html;

    // Auto init function (init_patients, init_dashboard, ...)
    const initFn = window[`init_${view}`];
    if (typeof initFn === "function") {
      console.log(`🔧 Init page: ${view}`);
      initFn();
    } else {
      console.log(`ℹ️ No init function for page: ${view}`);
    }

  } catch (err) {
    console.error(err);
    viewContainer.innerHTML = `
      <div class="alert alert-danger m-3">
        ❌ ไม่สามารถโหลดหน้า <b>${view}</b>
      </div>
    `;
  }
}

/* =========================
   SIDEBAR
========================= */
function handleToggleSidebar() {
  if (!sidebar) return;
  sidebar.classList.toggle("collapsed");
}

/* =========================
   LOGOUT (DEMO)
========================= */
function handleLogout() {
  const ok = window.confirm("ต้องการออกจากระบบหรือไม่?");
  if (!ok) return;

  console.log("🚪 Logout (demo)");
  alert("Logout (demo)");
  // future: clear token + redirect
}

/* =========================
   EVENT BINDING (CSP SAFE)
========================= */
function bindGlobalEvents() {

  // Sidebar toggle
  const btnToggle = document.getElementById("btnToggleSidebar");
  if (btnToggle) {
    btnToggle.addEventListener("click", handleToggleSidebar);
  }

  // Logout
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", handleLogout);
  }

  // SPA navigation
  document.querySelectorAll("[data-nav]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const view = el.getAttribute("data-nav");
      if (view) {
        navTo(view);
      }
    });
  });
}

/* =========================
   INIT : PATIENTS (UPLOAD ONLY)
   ❌ ไม่มี Table / ไม่มี GET list
========================= */
window.init_patients = function () {
  console.log("📤 init_patients (upload-only mode)");

  const fileInput = document.getElementById("fileInput");
  const submitBtn = document.getElementById("submitFile");
  const fileName = document.getElementById("fileName");

  if (!fileInput || !submitBtn) return;

  fileInput.addEventListener("change", () => {
    fileName.textContent = fileInput.files[0]
      ? fileInput.files[0].name
      : "ยังไม่ได้เลือกไฟล์";
  });

  // NOTE:
  // - logic upload / progress / report
  // - ให้ผูก API POST /api/patients/upload ที่นี่
  // - ไม่มีการโหลดรายชื่อ / render table ใด ๆ
};

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ app.js loaded (CSP Safe)");
  bindGlobalEvents();
  navTo("dashboard");
});
