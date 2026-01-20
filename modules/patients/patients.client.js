/*************************************************
 * modules/patients/patients.client.js
 * PATIENTS CLIENT (SPA SAFE + HEADER BASED)
 *************************************************/

let patientsData = [];

/* ===============================
   THAI DATE HELPER
   yyyyMMdd OR yyyy-mm-dd
================================ */
function toThaiDate(dateStr) {
  if (!dateStr) return "";

  let y, m, d;

  if (/^\d{8}$/.test(dateStr)) {
    y = dateStr.substring(0, 4);
    m = dateStr.substring(4, 6);
    d = dateStr.substring(6, 8);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    [y, m, d] = dateStr.split("-");
  } else {
    return "";
  }

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  return `${parseInt(d, 10)} ${thaiMonths[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
}

function normalizeCID(cid) {
  if (!cid) return "";
  return String(cid)
    .replace(/'/g, "")
    .replace(/\D/g, "")
    .padStart(13, "0");
}


/* ===============================
   INIT
================================ */
function initPatients() {
  console.log("🧑‍⚕️ initPatients");

  const fileInput = document.getElementById("fileInput");
  const searchInput = document.getElementById("searchInput");
  const checkAll = document.getElementById("checkAll");
  const btnSave = document.getElementById("btnSaveSelected");

  if (!fileInput) return;

  fileInput.addEventListener("change", handleFileSelect);
  searchInput.addEventListener("input", handleSearch);
  checkAll.addEventListener("change", toggleAll);
  btnSave.addEventListener("click", saveSelected);
}

/* ===============================
   FILE READ
================================ */
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("fileName").innerText = file.name;

  const reader = new FileReader();
  reader.onload = () => parseTxt(reader.result);
  reader.readAsText(file, "utf-8");
}

/* ===============================
   PARSE TXT (HEADER BASED)
================================ */
function parseTxt(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) {
    alert("ไฟล์ไม่มีข้อมูล");
    return;
  }

  // HEADER
  const headers = lines[0].split("|").map(h => h.trim());

  patientsData = lines.slice(1).map(line => {
    const cols = line.split("|");
    const o = {};

    headers.forEach((h, i) => {
      o[h] = (cols[i] || "").trim();
    });

    return {
      CID: normalizeCID(o.CID),
      PRENAME: o.PRENAME || "",
      NAME: o.NAME || "",
      LNAME: o.LNAME || "",
      HN: o.HN || "",
      SEX: o.SEX || "",
      BIRTH: o.BIRTH || "",
      BIRTH_THAI: toThaiDate(o.BIRTH),
      TELEPHONE: o.TELEPHONE || "",
      MOBILE: o.MOBILE || "",
      checked: true
    };
  }).filter(r => r.CID && r.NAME && r.LNAME);

  if (patientsData.length === 0) {
    alert("ไม่พบข้อมูลที่ถูกต้อง");
    return;
  }

  document.getElementById("searchSection").classList.remove("d-none");
  document.getElementById("previewSection").classList.remove("d-none");

  renderTable(patientsData);
}

/* ===============================
   RENDER TABLE
================================ */
function renderTable(data) {
  const tbody = document.getElementById("previewTableBody");
  tbody.innerHTML = "";

  data.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center">
        <input type="checkbox"
               class="row-check"
               data-index="${i}"
               ${r.checked ? "checked" : ""}>
      </td>
      <td>${r.CID}</td>
      <td>${r.NAME} ${r.LNAME}</td>
      <td>${r.BIRTH_THAI}</td>
      <td>${r.TELEPHONE}</td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".row-check").forEach(cb => {
    cb.addEventListener("change", e => {
      const i = e.target.dataset.index;
      data[i].checked = e.target.checked;
    });
  });
}

/* ===============================
   SEARCH
================================ */
function handleSearch(e) {
  const q = e.target.value.toLowerCase();

  const filtered = patientsData.filter(r =>
    r.CID.toLowerCase().includes(q) ||
    r.NAME.toLowerCase().includes(q) ||
    r.LNAME.toLowerCase().includes(q)
  );

  renderTable(filtered);
}

/* ===============================
   CHECK ALL
================================ */
function toggleAll(e) {
  const checked = e.target.checked;
  patientsData.forEach(r => r.checked = checked);
  renderTable(patientsData);
}

/* ===============================
   SAVE SELECTED
================================ */
async function saveSelected() {
  const selected = patientsData.filter(r => r.checked);

  if (selected.length === 0) {
    alert("กรุณาเลือกข้อมูล");
    return;
  }

  try {
    const res = await fetch("/api/patients/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected)
    });

    const json = await res.json();

    if (!json.success) {
      alert(json.message || "Import failed");
      return;
    }

    alert(
  `บันทึกข้อมูลสำเร็จ\n` +
  `🔁 อัปเดต: ${json.updated || 0} รายการ\n` +
  `➕ เพิ่มใหม่: ${json.inserted || 0} รายการ`
);

/* 🔥 RESET ที่หายจริง */
loadView("patients");

  } catch (err) {
    console.error(err);
    alert("เกิดข้อผิดพลาด");
  }
}

