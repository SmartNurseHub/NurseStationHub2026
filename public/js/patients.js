/*************************************************
 * patients.js — FINAL VERSION
 *************************************************/

console.log("✅ patients.js loaded");

window.init_patients = function () {
  console.log("🔧 init_patients() START");

  /* ===============================
     DOM
  ================================ */
  const fileInput = document.getElementById("fileInput");
  const fileNameLabel = document.getElementById("fileName");
  const btnImport = document.getElementById("btnImport");

  const searchSection = document.getElementById("searchSection");
  const searchInput = document.getElementById("searchInput");

  const previewSection = document.getElementById("previewSection");
  const tableBody = document.getElementById("previewTableBody");
  const checkAllBox = document.getElementById("checkAll");
  const btnSave = document.getElementById("btnSaveSelected");

  console.log("🧪 DOM:", {
    fileInput,
    btnImport,
    btnSave,
    tableBody
  });

  /* ===============================
     STATE
  ================================ */
  let rawPatients = [];
  let filteredPatients = [];

  /* ===============================
     FILE SELECT
  ================================ */
  fileInput.addEventListener("change", () => {
    fileNameLabel.textContent =
      fileInput.files[0]?.name || "ยังไม่ได้เลือกไฟล์";
  });

  /* ===============================
     IMPORT FILE
  ================================ */
  btnImport.addEventListener("click", () => {
    console.log("🟢 btnImport CLICKED");

    const file = fileInput.files[0];
    if (!file) {
      alert("กรุณาเลือกไฟล์ TXT");
      return;
    }

    const reader = new FileReader();
    reader.onload = e => parseTXT(e.target.result);
    reader.readAsText(file, "utf-8");
  });

  /* ===============================
     PARSE TXT
  ================================ */
  function parseTXT(text) {
    console.log("📄 parsing txt");

    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      alert("ไฟล์ไม่มีข้อมูล");
      return;
    }

    const headers = lines[0].split("|").map(h => h.trim());

    rawPatients = lines.slice(1).map(line => {
      const cols = line.split("|");
      const o = {};
      headers.forEach((h, i) => {
        o[h] = (cols[i] || "").trim();
      });
      return o;
    });

    console.log("📊 parsed:", rawPatients.length);
    filteredPatients = [...rawPatients];

    renderTable(filteredPatients);
    previewSection.classList.remove("d-none");
    searchSection.classList.remove("d-none");
  }

  /* ===============================
     RENDER TABLE
  ================================ */
  function renderTable(data) {
    tableBody.innerHTML = "";

    data.forEach((p, i) => {
      tableBody.innerHTML += `
        <tr>
          <td class="text-center">
            <input type="checkbox"
                   class="row-check"
                   data-index="${i}">
          </td>
          <td>${p.CID || ""}</td>
          <td>${p.NAME || ""}</td>
          <td>${p.LNAME || ""}</td>
        </tr>
      `;
    });

    checkAllBox.checked = false;
  }

  /* ===============================
     CHECK ALL
  ================================ */
  checkAllBox.addEventListener("change", () => {
    document.querySelectorAll(".row-check").forEach(cb => {
      cb.checked = checkAllBox.checked;
    });
  });

  /* ===============================
     SEARCH
  ================================ */
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.trim().toLowerCase();

    filteredPatients = rawPatients.filter(p =>
      (p.CID || "").toLowerCase().includes(keyword) ||
      (p.NAME || "").toLowerCase().includes(keyword) ||
      (p.LNAME || "").toLowerCase().includes(keyword)
    );

    renderTable(filteredPatients);
  });

  /* ===============================
     SAVE SELECTED
  ================================ */
  btnSave.addEventListener("click", async () => {
    const checked = document.querySelectorAll(".row-check:checked");

    if (checked.length === 0) {
      alert("กรุณาเลือกข้อมูลอย่างน้อย 1 รายการ");
      return;
    }

    const payload = Array.from(checked).map(cb => {
      const p = filteredPatients[cb.dataset.index];
      return {
        CID: p.CID,
        PRENAME: p.PRENAME,
        NAME: p.NAME,
        LNAME: p.LNAME,
        HN: p.HN,
        SEX: p.SEX,
        BIRTH: p.BIRTH,
        TELEPHONE: p.TELEPHONE,
        MOBILE: p.MOBILE
      };
    });

    console.log("📤 payload(valid CID):", payload.length);

    try {
      const res = await fetch("/api/patients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("save failed");

      const result = await res.json();
      alert(`✅ บันทึกสำเร็จ ${result.total} รายการ`);

      resetPage();

    } catch (err) {
      console.error("❌ save error:", err);
      alert("❌ ไม่สามารถบันทึกข้อมูล");
    }
  });

  /* ===============================
     RESET PAGE
  ================================ */
  function resetPage() {
    fileInput.value = "";
    fileNameLabel.textContent = "ยังไม่ได้เลือกไฟล์";
    searchInput.value = "";

    rawPatients = [];
    filteredPatients = [];

    tableBody.innerHTML = "";
    previewSection.classList.add("d-none");
    searchSection.classList.add("d-none");
  }
};
