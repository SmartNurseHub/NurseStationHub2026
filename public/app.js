// ======================================================================
// app.js — Front-end Controller (FIXED & PRODUCTION READY)
// NurseStationHub2026
// ======================================================================

// =======================
// GLOBAL CONFIG
// =======================
const API_BASE = "/api/sheet";

let patientsData = [];
let patientIndex = [];

let nursingFormMode = "add";
let editingNSR = null;
let nursingRecordsCache = [];

// =======================
// UTILITIES
// =======================
function $id(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// =======================
// SPA NAVIGATION
// =======================
function navTo(view) {
  const container = $id("view-container");
  if (!container) return;

  fetch(`views/${view}.html`)
    .then(r => {
      if (!r.ok) throw new Error("view not found");
      return r.text();
    })
    .then(html => {
      container.innerHTML = html;

      if (view === "patients") {
        loadPatients();
        setupPatientUpload();
      }

      if (view === "nursingRecords") {
        setupNursingForm();
        loadPatients().then(setupPatientSearch);
        loadNursingRecords();
      }
    })
    .catch(() => {
      container.innerHTML = `<p class="text-danger">โหลดหน้า ${view} ไม่สำเร็จ</p>`;
    });
}

// =======================
// LOAD PATIENTS  ✅ FIXED (lowercase)
// =======================
async function loadPatients() {
  try {
    const res = await fetch(`${API_BASE}/patients`);
    const json = await res.json();

    if (!json.success) throw new Error("API error");

    patientsData = json.data || [];
    patientIndex = patientsData.map((p, i) => ({
      i,
      text: `${p.HN || ""} ${p.NAME || ""} ${p.LNAME || ""} ${p.CID || ""}`.toLowerCase()
    }));

    console.log("Patients loaded:", patientsData.length);

  } catch (err) {
    console.error("loadPatients failed", err);
    patientsData = [];
    patientIndex = [];
  }
}

// =======================
// PATIENT SEARCH
// =======================
function setupPatientSearch() {
  const input = $id("patientSearch");
  const list = $id("searchResults");
  if (!input || !list) return;

  input.oninput = () => {
    const q = input.value.toLowerCase();
    list.innerHTML = "";
    if (!q) return;

    const hits = patientIndex
      .filter(x => x.text.includes(q))
      .slice(0, 10);

    hits.forEach(h => {
      const p = patientsData[h.i];
      const div = document.createElement("div");
      div.className = "list-group-item list-group-item-action";
      div.textContent = `${p.NAME || ""} ${p.LNAME || ""} (${p.HN || "-"})`;

      div.onclick = () => {
        $id("HN").value = p.HN || "";
        $id("CID").value = p.CID || "";
        $id("NAME").value = p.NAME || "";
        $id("LNAME").value = p.LNAME || "";
        list.innerHTML = "";
      };

      list.appendChild(div);
    });
  };
}

// =======================
// NURSING RECORDS
// =======================
async function loadNursingRecords() {
  try {
    const res = await fetch(`${API_BASE}/nursingRecords`);
    const json = await res.json();

    if (!json.success) throw new Error("API error");

    nursingRecordsCache = json.data || [];
    renderNursingRecords(nursingRecordsCache);

  } catch (err) {
    console.error("loadNursingRecords failed", err);
  }
}

function renderNursingRecords(records) {
  const tbody = $id("nursingTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.NSR || ""}</td>
      <td>${r.DateService || ""}</td>
      <td>${r.HN || ""}</td>
      <td>${escapeHtml(r.NAME)} ${escapeHtml(r.LNAME)}</td>
      <td>${escapeHtml(r.Activity || "")}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-nsr" data-nsr="${r.NSR}">
          ✏️
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// =======================
// NURSING FORM SUBMIT
// =======================
function setupNursingForm() {
  const form = $id("nursingForm");
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    if (nursingFormMode === "edit" && editingNSR) {
      data._mode = "edit";
      data._key = editingNSR;
    }

    try {
      const res = await fetch(`${API_BASE}/nursingRecords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!json.success) throw new Error();

      alert("บันทึกสำเร็จ");
      navTo("nursingRecords");

    } catch {
      alert("บันทึกไม่สำเร็จ");
    }
  };
}

// =======================
// PATIENT UPLOAD (XMLHttpRequest)
// =======================
function setupPatientUpload() {
  const btn = $id("submitFile");
  const fileInput = $id("fileInput");

  if (!btn || !fileInput) return;

  btn.onclick = () => {
    if (!fileInput.files.length) {
      alert("กรุณาเลือกไฟล์");
      return;
    }

    const fd = new FormData();
    fd.append("file", fileInput.files[0]);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/patients/upload`);

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        alert(json.success ? "อัปโหลดสำเร็จ" : "อัปโหลดล้มเหลว");
        if (json.success) loadPatients();
      } catch {
        alert("response error");
      }
    };

    xhr.onerror = () => alert("network error");
    xhr.send(fd);
  };
}

// =======================
// AUTO START
// =======================
navTo("patients");
