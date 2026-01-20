/*************************************************
<<<<<<< HEAD
 * public/js/patients.js
 * PATIENTS IMPORT — SPA SAFE VERSION
=======
 * patients.js — FINAL VERSION
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
 *************************************************/

console.log("✅ patients.js loaded");

window.init_patients = function () {
<<<<<<< HEAD
  console.log("🔧 init_patients START");
=======
  console.log("🔧 init_patients() START");
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b

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

<<<<<<< HEAD
  if (!fileInput || !btnImport) {
    console.warn("⚠️ patients DOM not ready");
    return;
  }
=======
  console.log("🧪 DOM:", {
    fileInput,
    btnImport,
    btnSave,
    tableBody
  });
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b

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
<<<<<<< HEAD
=======
    console.log("🟢 btnImport CLICKED");

>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
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
<<<<<<< HEAD
     PARSE TXT (HEADER BASED)
  ================================ */
  function parseTxt(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) {
    alert("ไฟล์ไม่มีข้อมูล");
    return;
  }

  // 1️⃣ อ่าน header
  const headers = lines[0].split("|").map(h => h.trim());

  // 2️⃣ map ข้อมูลแต่ละแถว
  patientsData = lines.slice(1).map(line => {
    const cols = line.split("|");
    const o = {}; // ✅ FIX: ประกาศ o ที่นี่

    headers.forEach((h, i) => {
      o[h] = (cols[i] || "").trim();
    });

    return {
      CID: o.CID,
      PRENAME: o.PRENAME,
      NAME: o.NAME,
      LNAME: o.LNAME,
      HN: o.HN,
      SEX: o.SEX,
      BIRTH: o.BIRTH,
      TELEPHONE: o.TELEPHONE,
      MOBILE: o.MOBILE,
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


=======
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

>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
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
<<<<<<< HEAD
          <td>เลขประจำตัวประชาชน</td>
          <td>ชื่อ - นามสกุล</td>
=======
          <td>${p.CID || ""}</td>
          <td>${p.NAME || ""}</td>
          <td>${p.LNAME || ""}</td>
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
        </tr>
      `;
    });

    checkAllBox.checked = false;
  }

  /* ===============================
     CHECK ALL
  ================================ */
  checkAllBox.addEventListener("change", () => {
<<<<<<< HEAD
    document.querySelectorAll(".row-check")
      .forEach(cb => cb.checked = checkAllBox.checked);
=======
    document.querySelectorAll(".row-check").forEach(cb => {
      cb.checked = checkAllBox.checked;
    });
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
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

<<<<<<< HEAD
=======
    console.log("📤 payload(valid CID):", payload.length);

>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
    try {
      const res = await fetch("/api/patients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

<<<<<<< HEAD
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      alert(`✅ บันทึกสำเร็จ ${result.saved} รายการ`);
      resetPage();

    } catch (err) {
      console.error(err);
=======
      if (!res.ok) throw new Error("save failed");

      const result = await res.json();
      alert(`✅ บันทึกสำเร็จ ${result.total} รายการ`);

      resetPage();

    } catch (err) {
      console.error("❌ save error:", err);
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
      alert("❌ ไม่สามารถบันทึกข้อมูล");
    }
  });

  /* ===============================
<<<<<<< HEAD
     RESET
=======
     RESET PAGE
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
  ================================ */
  function resetPage() {
    fileInput.value = "";
    fileNameLabel.textContent = "ยังไม่ได้เลือกไฟล์";
    searchInput.value = "";
<<<<<<< HEAD
    rawPatients = [];
    filteredPatients = [];
=======

    rawPatients = [];
    filteredPatients = [];

>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
    tableBody.innerHTML = "";
    previewSection.classList.add("d-none");
    searchSection.classList.add("d-none");
  }
};
