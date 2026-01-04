// =======================================================
// patients.js
// จัดการอัปโหลดรายชื่อผู้รับบริการ (realtime progress)
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

    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    statusEl.textContent = "กำลังอัปโหลด...";

    try {
      const text = await fileInput.files[0].text();
      const lines = text.split(/\r?\n/).filter(Boolean);

      if (lines.length < 2) {
        throw new Error("ไฟล์ไม่มีข้อมูล");
      }

      const header = lines[0];
      const dataRows = lines.slice(1); // ตัด header
      const total = dataRows.length;

      totalRowsEl.textContent = total;

      let newRows = 0;
      let updatedRows = 0;
      const batchSize = 10; // ปรับได้ตามความเร็ว

      for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize).join("\n");
        const blob = new Blob([header + "\n" + batch], { type: "text/plain" });
        const formData = new FormData();
        formData.append("file", blob, fileInput.files[0].name);

        const res = await fetch("/api/sheet/patients/upload", {
          method: "POST",
          body: formData
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Upload failed");
        }

        // อัปเดต counters แบบ realtime
        newRows += result.newRows;
        updatedRows += result.updatedRows;

        const progress = Math.round(Math.min(((i + batch.length) / total) * 100, 100));
        progressBar.style.width = progress + "%";
        progressBar.textContent = progress + "%";

        newRowsEl.textContent = newRows;
        updatedRowsEl.textContent = updatedRows;
      }

      progressBar.style.width = "100%";
      progressBar.textContent = "100%";
      statusEl.textContent = "อัปโหลดสำเร็จ";

    } catch (err) {
      console.error(err);
      statusEl.textContent = "เกิดข้อผิดพลาดในการอัปโหลด";
    }
  });

});
