/*************************************************
 * app.js — SPA CORE (STABLE PATTERN)
 *************************************************/

/* =========================
   GLOBAL CONFIG
========================= */
const DEFAULT_VIEW = "dashboard";
const VIEW_PATH = "/views";

/* =========================
   LAYOUT CONTROL
========================= */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const body = document.body;

  sidebar?.classList.toggle("collapsed");
  body.classList.toggle("sidebar-collapsed");
}

/* =================================================
   VIEW LOADER (AJAX)
   Pattern:
   1. Fetch HTML
   2. Inject DOM
   3. Call init_{view} AFTER DOM ready
================================================= */
async function loadView(viewName) {
  const container = document.getElementById("view-container");
  if (!container) {
    console.error("❌ view-container not found");
    return;
  }

  console.log("📦 loadView:", viewName);
  container.innerHTML = "⏳ กำลังโหลด...";

  try {
    const res = await fetch(`${VIEW_PATH}/${viewName}.html`);
    if (!res.ok) throw new Error(`View not found: ${viewName}`);

    const html = await res.text();
    container.innerHTML = html;

    // 🔒 DOM inject เสร็จแน่นอน
    requestAnimationFrame(() => {
      const initFnName = `init_${viewName}`;
      const initFn = window[initFnName];

      if (typeof initFn === "function") {
        console.log("🔧 call", initFnName);
        initFn();
      } else {
        console.log("ℹ️ no init function:", viewName);
      }
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="alert alert-danger">
        ❌ ไม่พบหน้า <b>${viewName}</b>
      </div>
    `;
  }
}

/* =================================================
   NAVIGATION HANDLER (SPA)
================================================= */
document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-nav]");
  if (!link) return;

  e.preventDefault();
  const viewName = link.dataset.nav;
  if (!viewName) return;

  console.log("🧭 navigate →", viewName);
  window.location.hash = viewName;
});

/* =================================================
   HASH ROUTER
================================================= */
function resolveRoute() {
  const view = location.hash.replace("#", "") || DEFAULT_VIEW;
  loadView(view);
}

window.addEventListener("hashchange", resolveRoute);

/* =========================
   APP BOOTSTRAP
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 app start");
  resolveRoute();
});

/* =========================
   AUTH (DEMO)
========================= */
function logout() {
  if (!confirm("ต้องการออกจากระบบหรือไม่?")) return;
  alert("ออกจากระบบแล้ว (ตัวอย่าง)");
  location.reload();
}
