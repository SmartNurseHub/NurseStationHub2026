/******************************************************************
 * patients.js
 * STABLE — SPA SAFE
 ******************************************************************/

console.log("✅ patients.js loaded");

const API = "/api/patients";

// DOM refs (จะ set ตอน init เท่านั้น)
let uploadReport;
let totalRowsEl;
let newRowsEl;
let updatedRowsEl;
let uploadStatusEl;

/* ================= LOAD TABLE ================= */
async function loadPatients() {
  console.log("📡 Loading patients...");
  const res = await fetch(API);
  const data = await res.json();
  console.log("📦 Patients data:", data);
  renderTable(data);
}

/* ================= RENDER TABLE ================= */
function renderTable(rows) {
  const head = document.getElementById("patientsTableHead");
  const body = document.querySelector("#patientsTable tbody");

  head.innerHTML = "";
  body.innerHTML = "";

  if (!rows || !rows.length) return;

  Object.keys(rows[0]).forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    head.appendChild(th);
  });

  rows.forEach(r => {
    const tr = document.createElement("tr");
    Object.values(r).forEach(v => {
      const td = document.createElement("td");
      td.textContent = v ?? "";
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });

  console.log(`✅ Rendered ${rows.length} rows`);
}

/* ================= UPLOAD ================= */
async function handleUpload() {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput || !fileInput.files.length) {
    alert("กรุณาเลือกไฟล์");
    return;
  }

  // ตอนนี้ element มีจริงแล้ว
  uploadReport.classList.remove("d-none");

  totalRowsEl.textContent = "0";
  newRowsEl.textContent = "0";
  updatedRowsEl.textContent = "0";
  uploadStatusEl.textContent = "กำลังอัปโหลด...";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: formData
    });

    const result = await res.json();
    console.log("📊 Upload result:", result);

    totalRowsEl.textContent   = result.total ?? 0;
    newRowsEl.textContent     = result.inserted ?? 0;
    updatedRowsEl.textContent = result.updated ?? 0;
    uploadStatusEl.textContent = "บันทึกข้อมูลเรียบร้อยแล้ว";

    await loadPatients();

  } catch (err) {
    console.error(err);
    uploadStatusEl.textContent = "เกิดข้อผิดพลาด";
  }
}

/* ================= INIT (สำคัญที่สุด) ================= */
window.init_patients = () => {
  console.log("🔧 init_patients()");

  // ✅ query DOM หลัง view ถูก inject
  uploadReport   = document.getElementById("uploadReport");
  totalRowsEl    = document.getElementById("totalRows");
  newRowsEl      = document.getElementById("newRows");
  updatedRowsEl  = document.getElementById("updatedRows");
  uploadStatusEl = document.getElementById("uploadStatus");

  document
    .getElementById("submitFile")
    ?.addEventListener("click", handleUpload);

  loadPatients();
};
