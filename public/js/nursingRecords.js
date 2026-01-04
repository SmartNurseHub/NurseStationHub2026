// =========================================================
// nursingRecords.js — Render Production Safe
// (Tab control + Load + Edit only)
// =========================================================

const API_BASE = "/api/sheet";

/* ======================= UTIL ======================= */
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ======================= TAB CONTROL ======================= */
document.addEventListener("click", e => {

  const openTab = e.target.closest(".open-tab");
  if (openTab) {
    e.preventDefault();
    const tab = openTab.dataset.targetTab;
    document.querySelectorAll(".nr-tab-panel")
      .forEach(p => p.style.display = "none");
    document.querySelector(`.nr-tab-panel[data-tab="${tab}"]`)
      ?.style.setProperty("display", "block");
    return;
  }

  const btn = e.target.closest(".nr-tab-btn");
  if (btn) {
    document.querySelectorAll(".nr-tab-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tabTarget;
    document.querySelectorAll(".nr-tab-panel")
      .forEach(p => p.style.display = "none");
    document.querySelector(`.nr-tab-panel[data-tab="${tab}"]`)
      ?.style.setProperty("display", "block");
  }
});

/* ======================= LOAD TABLE ======================= */
async function loadNursingRecords() {
  try {
    const res = await fetch(`${API_BASE}/nursing-records`);
    const result = await res.json();
    if (!result.success) return;

    const tbody = document.getElementById("nursingTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    result.data.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(r.NSR)}</td>
        <td>${escapeHtml(r.DateService)}</td>
        <td>${escapeHtml(r.HN)}</td>
        <td>${escapeHtml(r.NAME)} ${escapeHtml(r.LNAME)}</td>
        <td>${escapeHtml(r.Activity)}</td>
        <td>${escapeHtml(r.Provider1)}</td>
        <td>
          <button class="edit-record" data-nsr="${escapeHtml(r.NSR)}">
            ✏️
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Load NursingRecords failed:", err);
  }
}

/* ======================= LOAD TO FORM ======================= */
async function loadNursingRecordToForm(nsr) {
  try {
    const res = await fetch(`${API_BASE}/nursing-records/${nsr}`);
    const result = await res.json();

    if (!result.success) {
      alert("ไม่พบข้อมูล");
      return;
    }

    const form = document.getElementById("nursingForm");
    if (!form) return;

    Object.entries(result.data).forEach(([key, value]) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = value || "";
    });

    form.dataset.mode = "edit";
    form.dataset.nsr = nsr;

  } catch (err) {
    console.error("Load record error:", err);
  }
}

/* ======================= EDIT BUTTON ======================= */
document.addEventListener("click", e => {
  const btn = e.target.closest(".edit-record");
  if (!btn) return;
  loadNursingRecordToForm(btn.dataset.nsr);
});

/* ======================= FORM SUBMIT ======================= */
document.addEventListener("submit", async e => {
  const form = e.target.closest("#nursingForm");
  if (!form) return;

  e.preventDefault();

  if (form.dataset.mode !== "edit" || !form.dataset.nsr) {
    alert("โหมดเพิ่มใหม่ยังไม่เปิดใช้งาน");
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch(
      `${API_BASE}/nursing-records/${form.dataset.nsr}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const result = await res.json();
    if (!result.success) throw new Error();

    alert("แก้ไขข้อมูลเรียบร้อย");
    form.reset();
    delete form.dataset.mode;
    delete form.dataset.nsr;
    loadNursingRecords();

  } catch (err) {
    console.error(err);
    alert("บันทึกไม่สำเร็จ");
  }
});

/* ======================= SPA HOOK ======================= */
document.addEventListener("view-loaded-nursingRecords", loadNursingRecords);
