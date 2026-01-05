// ======================================================================
// app.js — Full SPA + Tab + Nursing + Patient + Form + Event Delegation
// ======================================================================

const API_BASE = "/api/sheet";
const $id = id => document.getElementById(id);

let patientsData = [];
let patientIndex = [];
let nursingRecordsCache = [];
let editingNSR = null;

/* ======================= SPA NAV ======================= */
function navTo(view) {
  fetch(`${view}.html`)
    .then(r => r.text())
    .then(html => {
      $id("view-container").innerHTML = html;

      // INIT AFTER LOADED HTML
      if (view === "patients") {
        loadPatients().then(() => setTimeout(initPatientUploadSSE, 0));
        setupPatientSearch();
      }

      if (view === "nursingRecords") {
        initNursingPage();
      }
    });
}

/* ======================= PATIENT ======================= */
async function loadPatients() {
  try {
    const res = await fetch(`${API_BASE}/patients`);
    const json = await res.json();
    patientsData = json.data || [];

    patientIndex = patientsData.map((p, i) => ({
      i,
      text: `${p.HN} ${p.NAME} ${p.LNAME}`.toLowerCase()
    }));
  } catch (err) {
    console.error("loadPatients:", err);
    patientsData = [];
    patientIndex = [];
  }
}

function setupPatientSearch() {
  const input = $id("patientSearch");
  const list = $id("searchResults");
  if (!input || !list) return;

  input.oninput = () => {
    list.innerHTML = "";
    const q = input.value.toLowerCase();
    if (!q) return;

    patientIndex
      .filter(x => x.text.includes(q))
      .slice(0, 10)
      .forEach(x => {
        const p = patientsData[x.i];
        const div = document.createElement("div");
        div.textContent = `${p.NAME} ${p.LNAME} (${p.HN})`;
        div.onclick = () => {
          ["HN", "CID", "NAME", "LNAME", "TELEPHONE"].forEach(k => {
            if ($id(k)) $id(k).value = p[k] || "";
          });
          list.innerHTML = "";
        };
        list.appendChild(div);
      });
  };
}

/* ======================= NURSING ======================= */
async function loadNursingRecords() {
  try {
    const res = await fetch(`${API_BASE}/nursing-records`);
    const json = await res.json();
    nursingRecordsCache = json.data || [];
    renderNursingTable();
  } catch (err) {
    console.error("loadNursingRecords:", err);
    nursingRecordsCache = [];
  }
}

function renderNursingTable() {
  const tbody = $id("nursingTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  nursingRecordsCache.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r.NSR}</td>
        <td>${r.DateService}</td>
        <td>${r.HN}</td>
        <td>${r.NAME} ${r.LNAME}</td>
        <td>${r.Activity}</td>
        <td>
          <button class="edit-record" data-nsr="${r.NSR}">✏️</button>
        </td>
      </tr>`;
  });
}

/* ======================= EDIT RECORD ======================= */
function bindEditButtons() {
  document.addEventListener("click", e => {
    const btn = e.target.closest(".edit-record");
    if (!btn) return;

    editingNSR = btn.dataset.nsr;
    const rec = nursingRecordsCache.find(r => r.NSR === editingNSR);
    if (!rec) return;

    Object.entries(rec).forEach(([k, v]) => {
      if ($id(k)) $id(k).value = v || "";
    });

    // เปิด tab online ถ้าใช้ tab เพิ่ม/แก้ไข
    const openTabBtn = document.querySelector('.open-tab[data-target-tab="online"]');
    if (openTabBtn) openTabBtn.click();
  });
}

/* ======================= NURSING FORM ======================= */
function setupNursingForm() {
  const form = $id("nursingForm");
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();

    if (!editingNSR) {
      alert("กรุณาเลือกหรือเพิ่มข้อมูลก่อน");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`${API_BASE}/nursing-records/${editingNSR}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        alert("บันทึกข้อมูลเรียบร้อยแล้ว");
        editingNSR = null;
        form.reset();
        loadNursingRecords();
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } catch (err) {
      console.error("saveNursingRecord:", err);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };
}

/* ========================
// TAB & DROPDOWN (Event Delegation)
======================== */
document.addEventListener("click", (e) => {
  const btn = e.target.closest('.open-tab');
  if (!btn) return;

  e.preventDefault();
  const targetTab = btn.dataset.targetTab;
  if (!targetTab) return;

  // ซ่อนทุก panel
  document.querySelectorAll('.nr-tab-panel').forEach(panel => {
    panel.style.display = 'none';
    panel.classList.remove('active');
  });

  // แสดง panel target
  const panel = document.querySelector(`.nr-tab-panel[data-tab="${targetTab}"]`);
  if (panel) {
    panel.style.display = 'block';
    panel.classList.add('active');
  }

  // ปิด dropdown menu ถ้ามี
  const dropdown = btn.closest('.dropdown');
  if (dropdown) {
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) menu.classList.remove('show');
  }
});

// Optional: Tab header buttons แบบ data-tab
document.addEventListener("click", (e) => {
  const btn = e.target.closest('.nr-tab-header button[data-tab]');
  if (!btn) return;

  const targetTab = btn.dataset.tab;
  if (!targetTab) return;

  // ซ่อนทุก panel
  document.querySelectorAll('.nr-tab-panel').forEach(panel => panel.style.display = 'none');
  // แสดง panel target
  const panel = document.querySelector(`.nr-tab-panel[data-tab="${targetTab}"]`);
  if (panel) panel.style.display = 'block';

  // เปลี่ยน active class ของ header
  document.querySelectorAll('.nr-tab-header button[data-tab]').forEach(h => h.classList.remove('active'));
  btn.classList.add('active');
});

/* ======================= INIT NURSING PAGE ======================= */
function initNursingPage() {
  loadPatients().then(setupPatientSearch);
  loadNursingRecords();
  setupNursingForm();
  bindEditButtons();

  // เปิด tab แรกอัตโนมัติ
  const firstTab = document.querySelector('.nr-tab-panel');
  if (firstTab) firstTab.style.display = 'block';
}

/* ======================= START ======================= */
navTo("dashboard");
