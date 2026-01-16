/******************************************************************
 * patients.js
 * UPLOAD ONLY (NO SSE)
 ******************************************************************/
"use strict";

const API = "/api/patients";

/* ================= DOM ================= */
let uploadStatusEl;

/* =========================================================
   HANDLE UPLOAD
========================================================= */
async function handleUpload() {
  const fileInput = document.getElementById("fileInput");

  if (!fileInput?.files.length) {
    alert("กรุณาเลือกไฟล์ก่อนอัปโหลด");
    return;
  }

  uploadStatusEl.textContent = "กำลังอัปโหลดไฟล์...";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      uploadStatusEl.textContent = "อัปโหลดล้มเหลว ❌";
      console.error(data);
      return;
    }

    uploadStatusEl.textContent =
      `สำเร็จ ✅ | รวม ${data.total} | อัปเดต ${data.updated} | เพิ่มใหม่ ${data.inserted}`;

  } catch (err) {
    console.error(err);
    uploadStatusEl.textContent = "Network error ❌";
  }
}

/* =========================================================
   INIT
========================================================= */
window.init_patients = () => {
  uploadStatusEl = document.getElementById("uploadStatus");

  document
    .getElementById("submitFile")
    ?.addEventListener("click", handleUpload);
};
