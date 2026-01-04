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
    .then(r => {
      if (!r.ok) throw new Error();
      return r.text();
    })
    .then(html => {
      container.innerHTML = html;

      if (view === "patients") {
        loadPatients();
      }

      if (view === "nursingRecords") {
        loadPatients().then(setupPatientSearch);
        loadNursingRecords();
        setupNursingForm();
      }
      if (view === "patients") {
        loadPatients();
        initPatientUpload();
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
function initPatientUpload() {
  const fileInput = $id("fileInput");
  const submitBtn = $id("submitFile");

  const progressContainer = $id("uploadProgressContainer");
  const progressBar = $id("uploadProgress");

  const totalRowsEl   = $id("totalRows");
  const newRowsEl     = $id("newRows");
  const updatedRowsEl = $id("updatedRows");
  const statusEl      = $id("uploadStatus");
  const fileNameEl    = $id("fileName");

  if (!fileInput || !submitBtn) return;

  // แสดงชื่อไฟล์
  fileInput.onchange = () => {
    fileNameEl.textContent = fileInput.files[0]
      ? fileInput.files[0].name
      : "ยังไม่ได้เลือกไฟล์";
    console.log("Selected file:", fileInput.files[0]);
  };

  submitBtn.onclick = async () => {
    if (!fileInput.files.length) {
      alert("กรุณาเลือกไฟล์");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    // รีเซ็ต progress bar และ status
    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    statusEl.textContent = "กำลังอัปโหลด...";
    totalRowsEl.textContent   = 0;
    newRowsEl.textContent     = 0;
    updatedRowsEl.textContent = 0;

    console.log("Starting upload for file:", fileInput.files[0].name);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/sheet/patients/upload");

      // อัปเดต progress bar realtime
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          progressBar.style.width = percent + "%";
          progressBar.textContent = percent + "%";
          console.log("Upload progress:", percent + "%");
        }
      };

      xhr.onload = async () => {
        console.log("XHR load event, status:", xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          let json;
          try {
            json = JSON.parse(xhr.responseText);
            console.log("Upload response JSON:", json);
          } catch (err) {
            console.error("Invalid JSON response:", xhr.responseText);
            statusEl.textContent = "อัปโหลดไม่สำเร็จ (Response ไม่ถูกต้อง)";
            return;
          }

          if (!json.success) {
            console.warn("Upload response success=false:", json.message);
            statusEl.textContent = "อัปโหลดไม่สำเร็จ: " + (json.message || "");
            return;
          }

          // อัปเดตแถวใหม่ / อัปเดตแถว
          console.log("Updating DOM counts:", {
            processed: json.processed,
            newRows: json.newRows,
            updatedRows: json.updatedRows
          });
          totalRowsEl.textContent   = json.processed ?? 0;
          newRowsEl.textContent     = json.newRows ?? 0;
          updatedRowsEl.textContent = json.updatedRows ?? 0;

          // progress bar เต็ม 100%
          progressBar.style.width = "100%";
          progressBar.textContent = "100%";
          statusEl.textContent = "อัปโหลดสำเร็จ";

          // โหลด patients cache ใหม่
          if (typeof loadPatients === "function") {
            console.log("Calling loadPatients() to refresh cache");
            loadPatients();
          }

          // ดึงจำนวนทั้งหมดจาก Sheet จริง
          try {
            console.log("Fetching totalRows from Sheet...");
            const res = await fetch("/api/sheet/patients/count"); // API ต้องคืนค่า { totalRows: number }
            const data = await res.json();
            console.log("Total rows from Sheet API:", data.totalRows);
            totalRowsEl.textContent = data.totalRows ?? ( (json.newRows??0) + (json.updatedRows??0) );
          } catch (err) {
            console.error("Error fetching totalRows:", err);
            // fallback ถ้า API ล้มเหลว
            totalRowsEl.textContent = (json.newRows??0) + (json.updatedRows??0);
          }

        } else {
          console.error("Upload failed:", xhr.status, xhr.statusText);
          statusEl.textContent = "อัปโหลดไม่สำเร็จ (HTTP Error)";
        }
      };

      xhr.onerror = () => {
        console.error("Upload network error");
        statusEl.textContent = "อัปโหลดไม่สำเร็จ (Network Error)";
      };

      console.log("Sending FormData to server...");
      xhr.send(formData);

    } catch (err) {
      console.error("Exception during upload:", err);
      statusEl.textContent = "อัปโหลดไม่สำเร็จ (Exception)";
    }
  };
}



/* ======================= START ======================= */
navTo("index");
