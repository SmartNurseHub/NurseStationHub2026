/*************************************************
 * upload.js
 * -----------------------------------------------
 * หน้าที่:
 * - เลือกไฟล์ TXT
 * - preview ข้อมูลผู้ป่วย
 * - เลือกแถว
 * - ส่งข้อมูลไป backend
 *
 * ใช้กับ:
 * - views/upload.html
 * - init_upload()
 *************************************************/

let previewData = [];
let table = null;

/* =================================================
   INIT VIEW
================================================= */
window.init_upload = function () {
  const fileInput = document.getElementById("fileInput");
  const fileName = document.getElementById("fileName");
  const submitBtn = document.getElementById("submitFile");
  const previewSection = document.getElementById("previewSection");

  if (!fileInput || !submitBtn) return;

  fileInput.addEventListener("change", () => {
    fileName.textContent = fileInput.files[0]
      ? fileInput.files[0].name
      : "ยังไม่ได้เลือกไฟล์";
  });

  submitBtn.addEventListener("click", () => {
    if (!fileInput.files.length) {
      alert("กรุณาเลือกไฟล์");
      return;
    }

    readTxtFile(fileInput.files[0]);
    previewSection.classList.remove("d-none");
  });

  document
    .getElementById("saveSelected")
    ?.addEventListener("click", saveSelectedRows);

  document
    .getElementById("checkAll")
    ?.addEventListener("change", toggleAll);
};

/* =================================================
   FILE READER
================================================= */
function readTxtFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewData = parseTxt(e.target.result);
    renderTable(previewData);
  };
  reader.readAsText(file, "utf-8");
}

/* =================================================
   SIMPLE PARSER (PREVIEW ONLY)
================================================= */
function parseTxt(rawText = "") {
  return rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const r = line.split("|");
      return {
        cid: r[1] || "",
        fname: r[5] || "",
        lname: r[6] || "",
        birth: r[9] || ""
      };
    });
}

/* =================================================
   TABLE RENDER
================================================= */
function renderTable(data) {
  if (table) table.destroy();

  const tbody = document.querySelector("#previewTable tbody");
  tbody.innerHTML = "";

  data.forEach((r, i) => {
    tbody.innerHTML += `
      <tr>
        <td><input type="checkbox" class="row-check" data-index="${i}"></td>
        <td>${r.cid}</td>
        <td>${r.fname}</td>
        <td>${r.lname}</td>
        <td>${r.birth}</td>
      </tr>
    `;
  });

  table = $("#previewTable").DataTable({ pageLength: 10 });
}

/* =================================================
   SELECT / SAVE
================================================= */
function toggleAll(e) {
  document.querySelectorAll(".row-check").forEach(cb => {
    cb.checked = e.target.checked;
  });
}

async function saveSelectedRows() {
  const rows = [];

  document.querySelectorAll(".row-check:checked").forEach(cb => {
    rows.push(previewData[cb.dataset.index]);
  });

  if (!rows.length) {
    alert("กรุณาเลือกข้อมูล");
    return;
  }

  const res = await fetch("/api/patients/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows })
  });

  const json = await res.json();
  alert(`บันทึกแล้ว ${json.count} รายการ`);

  resetUploadView();
}

/* =================================================
   RESET
================================================= */
function resetUploadView() {
  previewData = [];

  if (table) {
    table.destroy();
    table = null;
  }

  document.getElementById("fileInput").value = "";
  document.getElementById("fileName").textContent = "ยังไม่ได้เลือกไฟล์";
  document.getElementById("previewSection").classList.add("d-none");
  document.querySelector("#previewTable tbody").innerHTML = "";
}
