/*************************************************
 * modules/nursingRecords/nursingRecords.client.js
 *
 * หน้าที่:
 *  - ควบคุมหน้า Nursing Records (SPA)
 *  - ค้นหาผู้ป่วย + Auto fill
 *  - โหลด NSR No. อัตโนมัติ
 *
 * เชื่อมโยง:
 *  - /api/patients/search
 *  - /api/nursingRecords
 *  - /api/nursingRecords/next-nsr
 *************************************************/
console.log("🔥 nursingRecords.client.js LOADED");

/* =================================================
   STATE (SPA SAFE)
================================================= */
window.__NR_PATIENT_SEARCH__ = window.__NR_PATIENT_SEARCH__ || {
  lastKeyword: ""
};

/* =================================================
   INIT
================================================= */
function initNursingRecords() {
  console.log("📝 Nursing Records initialized");

  bindTabs();
  bindFormSubmit();
  bindPatientSearch();
  loadNextNSR();          // ✅ ดึง NSR ล่าสุด
  loadNursingRecords();
}

/* =================================================
   TAB CONTROL
================================================= */
function bindTabs() {
  document.querySelectorAll(".open-tab").forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();
      showTab(btn.dataset.targetTab);
    };
  });
}

function showTab(name) {
  document.querySelectorAll(".nr-tab-panel").forEach(p => {
    p.style.display = p.dataset.tab === name ? "block" : "none";
  });
}

/* =================================================
   FORM SUBMIT
================================================= */
function bindFormSubmit() {
  const form = document.getElementById("nursingForm");
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    data.Stamp = new Date().toISOString();

    try {
      const res = await fetch("/api/nursingRecords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw await res.json();

      alert("✅ บันทึกข้อมูลเรียบร้อย");
      form.reset();
      hidePatientResults();
      await loadNextNSR();   // ✅ เลขถัดไป
      loadNursingRecords();

    } catch (err) {
      console.error(err);
      alert("❌ บันทึกไม่สำเร็จ");
    }
  };
}

/* =================================================
   LOAD NEXT NSR
================================================= */
async function loadNextNSR() {
  const input = document.getElementById("NSR");
  if (!input) return;

  try {
    const res = await fetch("/api/nursingRecords/next-nsr");
    const data = await res.json();
    input.value = data.nsr || "";
  } catch (err) {
    console.error("❌ loadNextNSR error:", err);
    input.value = "";
  }
}

/* =================================================
   PATIENT SEARCH
================================================= */
function bindPatientSearch() {
  const btn = document.getElementById("btnSearchPatient");
  const input = document.getElementById("patientSearch");
  const resultBox = document.getElementById("searchResults");

  if (!btn || !input || !resultBox) {
    console.warn("⚠️ Patient search elements not found");
    return;
  }

  input.oninput = () => searchPatient(input.value.trim());
  input.onfocus = () => {
    if (input.value.trim()) searchPatient(input.value.trim());
  };

  btn.onclick = e => {
    e.preventDefault();
    searchPatient(input.value.trim());
  };

  document.addEventListener("click", e => {
    if (!e.target.closest("#patientSearch") &&
        !e.target.closest("#searchResults")) {
      hidePatientResults();
    }
  });
}

/* =================================================
   SEARCH CORE
================================================= */
async function searchPatient(keyword) {
  const resultBox = document.getElementById("searchResults");
  if (!keyword) {
    hidePatientResults();
    return;
  }

  if (window.__NR_PATIENT_SEARCH__.lastKeyword === keyword) return;
  window.__NR_PATIENT_SEARCH__.lastKeyword = keyword;

  resultBox.style.display = "block";
  resultBox.innerHTML =
    `<div class="list-group-item">⏳ กำลังค้นหา...</div>`;

  try {
    const res = await fetch(
      `/api/patients/search?q=${encodeURIComponent(keyword)}`
    );
    const result = await res.json();

    if (!Array.isArray(result.data) || result.data.length === 0) {
      resultBox.innerHTML =
        `<div class="list-group-item text-muted">ไม่พบข้อมูล</div>`;
      return;
    }

    resultBox.innerHTML = "";
    result.data.forEach(p => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.innerText = `${p.HN || "-"} | ${p.NAME} ${p.LNAME}`;

      btn.onclick = () => selectPatient(p);
      resultBox.appendChild(btn);
    });

  } catch (err) {
    console.error(err);
    resultBox.innerHTML =
      `<div class="list-group-item text-danger">ค้นหาล้มเหลว</div>`;
  }
}
function normalizePhone(phone) {
  if (!phone) return "";

  let s = String(phone).trim();

  // ถ้าเป็นตัวเลข 9 หลัก → เติม 0 หน้า
  if (/^\d{9}$/.test(s)) {
    s = "0" + s;
  }

  return s;
}

/* =================================================
   SELECT + AUTO FILL
================================================= */
function selectPatient(p) {
  console.log("👤 SELECTED PATIENT:", p);
  const map = {
    patientSearch: `${p.NAME} ${p.LNAME}`,
    CID: p.CID,
    HN: p.HN,
    NAME: p.NAME,
    LNAME: p.LNAME,
    TELEPHONE: normalizePhone(p.TELEPHONE || p.MOBILE)
  };

  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  hidePatientResults();
}

/* =================================================
   HIDE RESULT
================================================= */
function hidePatientResults() {
  const box = document.getElementById("searchResults");
  if (box) box.style.display = "none";
  window.__NR_PATIENT_SEARCH__.lastKeyword = "";
}

/* =================================================
   LOAD TABLE
================================================= */
async function loadNursingRecords() {
  const tbody = document.getElementById("nursingTableBody");
  if (!tbody) return;

  tbody.innerHTML =
    `<tr><td colspan="7" class="text-center">⏳ กำลังโหลดข้อมูล...</td></tr>`;

  try {
    const res = await fetch("/api/nursingRecords");
    if (!res.ok) throw new Error(res.status);

    const rows = (await res.json()).data || [];

    if (!rows.length) {
      tbody.innerHTML =
        `<tr><td colspan="7" class="text-center text-muted">ไม่มีข้อมูล</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.NSR || "-"}</td>
        <td>${r.DateService || "-"}</td>
        <td>${r.HN || "-"}</td>
        <td>${r.NAME || ""} ${r.LNAME || ""}</td>
        <td>${r.Activity || "-"}</td>
        <td>${r.Provider1 || "-"}</td>
        <td class="text-center">
          <button type="button"
                  class="btn btn-sm btn-warning"
                  onclick="editRecord('${r.NSR || ""}')">
            ✏️
          </button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("❌ loadNursingRecords error:", err);
    tbody.innerHTML =
      `<tr><td colspan="7" class="text-center text-danger">
        โหลดข้อมูลไม่สำเร็จ
      </td></tr>`;
  }
}

/* =================================================
   EDIT
================================================= */
function editRecord(nsr) {
  alert("🔧 โหมดแก้ไข NSR: " + nsr);
  showTab("online");
}

/* =================================================
   EXPORT
================================================= */
window.initNursingRecords = initNursingRecords;
