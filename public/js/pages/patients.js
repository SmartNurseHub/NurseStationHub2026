// ===================================================
// Patients Upload — SPA Safe
// ===================================================

document.getElementById("submitFile")?.addEventListener("click", async () => {
  const input = document.getElementById("fileInput");
  if (!input.files.length) return alert("กรุณาเลือกไฟล์");

  const formData = new FormData();
  formData.append("file", input.files[0]);

  try {
    const res = await fetch("/api/sheet/patients/upload", {
      method: "POST",
      body: formData
    });

    const result = await res.json();
    if (!result.success) throw new Error();

    document.getElementById("totalRows").innerText = result.totalRows;
    document.getElementById("newRows").innerText = result.newRows;
    document.getElementById("updatedRows").innerText = result.updatedRows;
    document.getElementById("uploadStatus").innerText = "อัปโหลดสำเร็จ";

  } catch {
    alert("อัปโหลดไม่สำเร็จ");
  }
});
