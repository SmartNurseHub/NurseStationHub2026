/******************************************************************
 * patients.js
 * STABLE — SPA SAFE
 * MODE: UPLOAD ONLY (❌ ไม่มี Table / ❌ ไม่มี GET list)
 ******************************************************************/

"use strict";

console.log("✅ patients.js loaded (upload-only)");

const API = "/api/patients";

// DOM refs (จะ set ตอน init เท่านั้น)
let uploadReport;
let totalRowsEl;
let newRowsEl;
let updatedRowsEl;
let uploadStatusEl;

/* ================= UPLOAD ================= */
async function handleUpload() {
  const fileInput = document.getElementById("fileInput");

  if (!fileInput || !fileInput.files.length) {
    alert("กรุณาเลือกไฟล์ก่อนอัปโหลด");
    return;
  }

  const file = fileInput.files[0]; // ✅ FIX: ประกาศ file ให้ชัดเจน

  // แสดง report
  uploadReport.classList.remove("d-none");

  // reset ค่า
  totalRowsEl.textContent    = "0";
  newRowsEl.textContent      = "0";
  updatedRowsEl.textContent  = "0";
  uploadStatusEl.textContent = "กำลังอัปโหลด...";

  const formData = new FormData();
formData.append("file", fileInput.files[0]);

await fetch("/api/patients/upload", {
  method: "POST",
  body: formData
});


  try {
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: formData // ❌ ห้ามใส่ headers
    });

    if (!res.ok) {
      throw new Error(`Upload failed (${res.status})`);
    }

    const result = await res.json();
    console.log("📊 Upload result:", result);

    totalRowsEl.textContent    = result.total ?? 0;
    newRowsEl.textContent      = result.inserted ?? 0;
    updatedRowsEl.textContent  = result.updated ?? 0;
    uploadStatusEl.textContent = "บันทึกข้อมูลเรียบร้อยแล้ว";

  } catch (err) {
    console.error("❌ Upload error:", err);
    uploadStatusEl.textContent = "เกิดข้อผิดพลาดในการอัปโหลด";
  }
}

/* ================= INIT (สำคัญที่สุด) ================= */
window.init_patients = () => {
  console.log("🔧 init_patients() [upload-only]");

  // ✅ query DOM หลัง view ถูก inject
  uploadReport   = document.getElementById("uploadReport");
  totalRowsEl    = document.getElementById("totalRows");
  newRowsEl      = document.getElementById("newRows");
  updatedRowsEl  = document.getElementById("updatedRows");
  uploadStatusEl = document.getElementById("uploadStatus");

  if (!uploadReport || !totalRowsEl) {
    console.warn("⚠️ uploadReport elements not found");
    return;
  }

  document
    .getElementById("submitFile")
    ?.addEventListener("click", handleUpload);
};
