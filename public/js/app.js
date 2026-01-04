// ======================================================================
// app.js — Front-end Controller (Render Production Safe)
// NurseStationHub2026
// ======================================================================

const API_BASE = "/api/sheet";

let patientsData = [];
let patientIndex = [];

let nursingRecordsCache = [];
let editingNSR = null;

/* ======================= UTIL ======================= */
const $id = id => document.getElementById(id);

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ======================= SPA NAV ======================= */
function navTo(view) {
  const container = $id("view-container");
  if (!container) return;

  fetch(`${view}.html`)
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(html => {
      container.innerHTML = html;

      if (view === "patients") {
        loadPatients().then(() => {
          initPatientUploadSSE();
        });
      }

      if (view === "nursingRecords") {
        loadPatients().then(setupPatientSearch);
        loadNursingRecords();
        setupNursingForm();
      }
    })
    .catch(() => {
      container.innerHTML = `<p class="text-danger">โหลดหน้าไม่สำเร็จ</p>`;
    });
}


/* ======================= PATIENTS ======================= */
async function loadPatients() {
  try {
    const res = await fetch(`${API_BASE}/patients`);
    const json = await res.json();
    if (!json.success) throw new Error();

    patientsData = json.data || [];
    patientIndex = patientsData.map((p, i) => ({
      i,
      text: `${p.HN || ""} ${p.NAME || ""} ${p.LNAME || ""}`.toLowerCase()
    }));
  } catch {
    patientsData = [];
    patientIndex = [];
  }
}

function setupPatientSearch() {
  const input = $id("patientSearch");
  const list = $id("searchResults");
  if (!input || !list) return;

  input.oninput = () => {
    const q = input.value.toLowerCase();
    list.innerHTML = "";
    if (!q) return;

    patientIndex
      .filter(x => x.text.includes(q))
      .slice(0, 10)
      .forEach(h => {
        const p = patientsData[h.i];
        const div = document.createElement("div");
        div.className = "list-group-item list-group-item-action";
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

/* ======================= NURSING RECORDS ======================= */
async function loadNursingRecords() {
  try {
    const res = await fetch(`${API_BASE}/nursing-records`);
    const json = await res.json();
    if (!json.success) throw new Error();

    nursingRecordsCache = json.data || [];
    renderNursingRecords(nursingRecordsCache);
  } catch (err) {
    console.error("loadNursingRecords error", err);
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
        <button class="edit-record" data-nsr="${r.NSR}">✏️</button>
      </td>
    `;
    tbody.appendChild(tr);
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
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();
    if (!editingNSR) {
      alert("โหมดเพิ่มใหม่ยังไม่เปิดใช้งาน");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`${API_BASE}/nursing-records/${editingNSR}`, {
        method: "PUT",
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
/* ======================= PATIENT UPLOAD ======================= */
function initPatientUploadSSE() {
  const fileInput = $id("fileInput");
  const submitBtn = $id("submitFile");
  const progressBar = $id("uploadProgress");
  const totalRowsEl = $id("totalRows");
  const newRowsEl = $id("newRows");
  const updatedRowsEl = $id("updatedRows");
  const statusEl = $id("uploadStatus");
  const fileNameEl = $id("fileName");

  if (!fileInput || !submitBtn) return;

  fileInput.onchange = () => {
    fileNameEl.textContent = fileInput.files[0]?.name || "ยังไม่ได้เลือกไฟล์";
  };

  submitBtn.onclick = async () => {
    if (!fileInput.files.length) return alert("กรุณาเลือกไฟล์");

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    // Reset progress bar
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    statusEl.textContent = "กำลังอัปโหลด...";
    totalRowsEl.textContent = 0;
    newRowsEl.textContent = 0;
    updatedRowsEl.textContent = 0;

    try {
      // 1️⃣ POST เพื่อสร้าง uploadId
      const res = await fetch(`${API_BASE}/patients/upload-temp`, {
        method: "POST",
        body: formData,
      });
      const { uploadId } = await res.json();

      // 2️⃣ SSE stream รับ progress ตาม uploadId
      const evtSource = new EventSource(`${API_BASE}/patients/upload-sse/${uploadId}`);

      evtSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        const percent = Math.round((data.processed / data.total) * 100);

        progressBar.style.width = percent + "%";
        progressBar.textContent = percent + "%";

        totalRowsEl.textContent = data.total;
        newRowsEl.textContent = data.newRows;
        updatedRowsEl.textContent = data.updatedRows;
        statusEl.textContent = `Uploading... ${percent}%`;
      };

      evtSource.addEventListener("done", () => {
        progressBar.style.width = "100%";
        progressBar.textContent = "100%";
        statusEl.textContent = "Upload completed!";
        evtSource.close();
      });

      evtSource.onerror = (err) => {
        console.error("SSE error", err);
        statusEl.textContent = "Upload failed (SSE error)";
        evtSource.close();
      };
    } catch (err) {
      console.error("Upload error", err);
      statusEl.textContent = "Upload failed (Exception)";
    }
  };
}





/* ======================= START ======================= */
navTo("index");
