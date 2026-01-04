// =======================================================
// patients.js — SSE Upload (Render Safe · FULL VERSION)
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

  /* ================= FILE NAME ================= */
  fileInput.addEventListener("change", () => {
    fileName.textContent = fileInput.files[0]
      ? fileInput.files[0].name
      : "ยังไม่ได้เลือกไฟล์";
  });

  /* ================= UPLOAD SSE ================= */
  submitBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) {
      alert("กรุณาเลือกไฟล์ก่อนอัปโหลด");
      return;
    }

    // reset UI
    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    statusEl.textContent = "กำลังอัปโหลด...";

    totalRowsEl.textContent = "0";
    newRowsEl.textContent = "0";
    updatedRowsEl.textContent = "0";

    try {
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);

      const res = await fetch("/api/sheet/patients/upload-sse", {
        method: "POST",
        body: formData
      });

      if (!res.ok || !res.body) {
        throw new Error("ไม่สามารถเชื่อมต่อ SSE");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop(); // เก็บเศษ

        for (const evt of events) {

          // DONE EVENT
          if (evt.startsWith("event: done")) {
            progressBar.style.width = "100%";
            progressBar.textContent = "100%";
            statusEl.textContent = "อัปโหลดสำเร็จ ✅";
            return;
          }

          // ERROR EVENT
          if (evt.startsWith("event: error")) {
            statusEl.textContent = "เกิดข้อผิดพลาด ❌";
            console.error(evt);
            return;
          }

          // DATA EVENT
          if (!evt.startsWith("data:")) continue;

          const json = evt.replace(/^data:\s*/, "").trim();
          if (!json) continue;

          const data = JSON.parse(json);

          const total = Number(data.total) || 0;
          const processed = Number(data.processed) || 0;

          const percent = total
            ? Math.min(100, Math.round((processed / total) * 100))
            : 0;

          progressBar.style.width = percent + "%";
          progressBar.textContent = percent + "%";

          totalRowsEl.textContent = total;
          newRowsEl.textContent = data.newRows ?? 0;
          updatedRowsEl.textContent = data.updatedRows ?? 0;

          statusEl.textContent = `Uploading... ${percent}%`;
        }
      }

    } catch (err) {
      console.error("Upload SSE error:", err);
      statusEl.textContent = "อัปโหลดล้มเหลว ❌";
    }
  });

});
