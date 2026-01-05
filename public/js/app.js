// ======================================================================
// app.js — Render Production Safe (FIXED)
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

      if (view === "patients") {
        loadPatients().then(() => setTimeout(initPatientUploadSSE, 0));
      }

      if (view === "nursingRecords") {
        initNursingPage();
      }
    });
}

/* ======================= PATIENT ======================= */
async function loadPatients() {
  const res = await fetch(`${API_BASE}/patients`);
  const json = await res.json();
  patientsData = json.data || [];

  patientIndex = patientsData.map((p, i) => ({
    i,
    text: `${p.HN} ${p.NAME} ${p.LNAME}`.toLowerCase()
  }));
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
  const res = await fetch(`${API_BASE}/nursing-records`);
  const json = await res.json();
  nursingRecordsCache = json.data || [];
  renderNursingTable();
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
  });
}

/* ======================= FORM ======================= */
function setupNursingForm() {
  const form = $id("nursingForm");
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();

    if (!editingNSR) {
      alert("โหมดเพิ่มใหม่ยังไม่เปิด");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    const res = await fetch(
      `${API_BASE}/nursing-records/${editingNSR}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const json = await res.json();
    if (json.success) {
      alert("แก้ไขข้อมูลเรียบร้อย");
      editingNSR = null;
      form.reset();
      loadNursingRecords();
    } else {
      alert("บันทึกไม่สำเร็จ");
    }
  };
}

/* ======================= INIT PAGE ======================= */
function initNursingPage() {
  loadPatients().then(setupPatientSearch);
  loadNursingRecords();
  setupNursingForm();
  bindEditButtons();
}

/* ======================= START ======================= */
navTo("dashboard");
