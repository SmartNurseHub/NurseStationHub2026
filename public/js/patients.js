// =======================================================
// patients.js
// จัดการอัปโหลดรายชื่อผู้รับบริการ
// =======================================================

document.addEventListener("DOMContentLoaded", () => {

  const fileInput = document.getElementById("fileInput");
  const submitBtn = document.getElementById("submitFile");
  const fileName  = document.getElementById("fileName");

  const progressContainer = document.getElementById("uploadProgressContainer");
  const progressBar = document.getElementById("uploadProgress");

  const totalRowsEl   = document.getElementById("totalRows");
  const newRowsEl     = document.getElementById("newRows");
  const updatedRowsEl = document.getElementById("updatedRows");
  const statusEl      = document.getElementById("uploadStatus");

  if (!fileInput || !submitBtn) return;

  // แสดงชื่อไฟล์
  fileInput.addEventListener("change", () => {
    fileName.textContent = fileInput.files[0]
      ? fileInput.files[0].name
      : "ยังไม่ได้เลือกไฟล์";
  });

  // กดอัปโหลด
  submitBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) {
      alert("กรุณาเลือกไฟล์ก่อนอัปโหลด");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    statusEl.textContent = "กำลังอัปโหลด...";

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Upload failed");
      }

      // update report
      totalRowsEl.textContent   = result.totalRows || 0;
      newRowsEl.textContent     = result.newRows || 0;
      updatedRowsEl.textContent = result.updatedRows || 0;

      progressBar.style.width = "100%";
      progressBar.textContent = "100%";
      statusEl.textContent = "อัปโหลดสำเร็จ";

    } catch (err) {
      console.error(err);
      statusEl.textContent = "เกิดข้อผิดพลาดในการอัปโหลด";
    }
  });

});
