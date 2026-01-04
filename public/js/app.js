// ======================================================================
// app.js — Front-end Controller (Render Safe + SSE)
// ======================================================================

const API_BASE = "/api/sheet";

/* ======================= GLOBAL ======================= */
let patientsData = [];
let patientIndex = [];
let nursingRecordsCache = [];
let editingNSR = null;

const $id = id => document.getElementById(id);

/* ======================= SPA NAV ======================= */
function navTo(view) {
  fetch(`${view}.html`)
    .then(r => r.text())
    .then(html => {
      $id("view-container").innerHTML = html;

      if (view === "patients") {
        loadPatients().then(initPatientUploadSSE);
      }

      if (view === "nursingRecords") {
        loadPatients().then(setupPatientSearch);
        loadNursingRecords();
        setupNursingForm();
      }
    });
}

/* ======================= PATIENTS ======================= */
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
          ["HN", "CID", "NAME", "LNAME"].forEach(k => {
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
  renderNursingRecords(nursingRecordsCache);
}

function renderNursingRecords(records) {
  const tbody = $id("nursingTableBody");
  tbody.innerHTML = "";

  records.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r.NSR}</td>
        <td>${r.DateService}</td>
        <td>${r.HN}</td>
        <td>${r.NAME} ${r.LNAME}</td>
        <td>${r.Activity}</td>
        <td><button class="edit-record" data-nsr="${r.NSR}">✏️</button></td>
      </tr>
    `;
  });
}

document.addEventListener("click", e => {
  const btn = e.target.closest(".edit-record");
  if (!btn) return;

  editingNSR = btn.dataset.nsr;
  const rec = nursingRecordsCache.find(r => r.NSR === editingNSR);
  if (!rec) return;

  Object.keys(rec).forEach(k => {
    if ($id(k)) $id(k).value = rec[k];
  });
});

/* ======================= FORM ======================= */
function setupNursingForm() {
  const form = $id("nursingForm");

  form.onsubmit = async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    const res = await fetch(`${API_BASE}/nursing-records/${editingNSR}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (json.success) {
      alert("บันทึกสำเร็จ");
      navTo("nursingRecords");
    } else {
      alert("บันทึกไม่สำเร็จ");
    }
  };
}

/* ======================= SSE UPLOAD ======================= */
function initPatientUploadSSE() {
  const fileInput = $id("fileInput");
  const submitBtn = $id("submitFile");
  const progress = $id("uploadProgress");
  const status = $id("uploadStatus");

  submitBtn.onclick = async () => {
    const fd = new FormData();
    fd.append("file", fileInput.files[0]);

    const res = await fetch(`${API_BASE}/patients/upload-sse`, {
      method: "POST",
      body: fd,
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value);
      const events = buffer.split("\n\n");
      buffer = events.pop();

      events.forEach(e => {
        if (!e.startsWith("data:")) return;
        const d = JSON.parse(e.replace("data:", ""));
        const percent = Math.round((d.processed / d.total) * 100);
        progress.style.width = percent + "%";
        progress.textContent = percent + "%";
        status.textContent = "Uploading...";
      });
    }

    status.textContent = "Upload completed ✅";
  };
}

/* ======================= START ======================= */
navTo("index");
