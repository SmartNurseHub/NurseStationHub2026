/************************************************************
 * modules/patients/patients.client.js
 * LARGE TXT IMPORT — 30,000+ ROWS SAFE (FINAL SYNC)
 ************************************************************/

console.log("🧑‍⚕️ patients.client.js LOADED (LARGE IMPORT MODE)");

/* =========================================================
   STATE
========================================================= */
const PatientsImportState = {
  allRows: [],
  filteredRows: [],
  selectedCID: new Set(),
  MAX_RENDER: 500
};

/* =========================================================
   INIT
========================================================= */
function initPatients() {
  console.log("🧑‍⚕️ initPatients (Large Import + Manual Ready)");

  bindFileInput();
  bindSearch();
  bindSave();

  // NEW
  bindModeSwitch();
  bindManualSave();
}

/* =========================================================
   FILE INPUT
========================================================= */
function bindFileInput() {
  const fileInput = document.getElementById("patientsTxtFile");
  if (!fileInput) return;

  fileInput.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();

    PatientsImportState.allRows = parsePatientsTxt(text);
    PatientsImportState.filteredRows = PatientsImportState.allRows;

    showPatientsPreview();
    renderPatientsTable();
    updateCounter();
  };
}

/* =========================================================
   PARSE TXT (MATCH REAL HOS FILE)
========================================================= */
function parsePatientsTxt(text) {
  let lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l);

  if (!lines.length) return [];

  /* ---------- REMOVE HEADER ---------- */
  if (lines[0].toLowerCase().startsWith("hospcode|cid")) {
    console.warn("⚠️ Header detected → removed");
    lines = lines.slice(1);
  }

  return lines
    .map(line => {
      const c = line.split("|");

      const tel    = c[30]?.trim();
      const mobile = c[31]?.trim();
      const birth  = c[9]?.trim();

      return {
        CID: c[1]?.trim(),            // CID
        PRENAME: c[4]?.trim(),        // PRENAME
        NAME: c[5]?.trim(),           // NAME
        LNAME: c[6]?.trim(),          // LNAME
        HN: c[7]?.trim(),             // HN
        SEX: c[8]?.trim(),            // SEX
        BIRTH: birth,                 // YYYYMMDD
        BIRTH_THAI: formatThaiDateLong(birth),
        TELEPHONE: tel || "",
        MOBILE: mobile || ""
      };
    })
    .filter(r => r.CID && /^\d{13}$/.test(r.CID));
}

/* =========================================================
   SEARCH
========================================================= */
function bindSearch() {
  const input = document.getElementById("patientsSearch");
  if (!input) return;

  input.oninput = () => {
    const q = input.value.trim();

    PatientsImportState.filteredRows = !q
      ? PatientsImportState.allRows
      : PatientsImportState.allRows.filter(r =>
          r.CID.includes(q) ||
          r.NAME.includes(q) ||
          r.LNAME.includes(q)
        );

    renderPatientsTable();
    updateCounter();
  };
}

/* =========================================================
   DATE FORMAT (THAI LONG)
========================================================= */
function formatThaiDateLong(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return "";

  const year = parseInt(yyyymmdd.slice(0, 4), 10) + 543;
  const monthIndex = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
  const day = parseInt(yyyymmdd.slice(6, 8), 10);

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  return `${day} ${thaiMonths[monthIndex]} ${year}`;
}

/* =========================================================
   RENDER TABLE (CHUNK)
========================================================= */
function renderPatientsTable() {
  const tbody = document.getElementById("patientsImportBody");
  if (!tbody) return;

  const rows = PatientsImportState.filteredRows.slice(
    0,
    PatientsImportState.MAX_RENDER
  );

  tbody.innerHTML = rows.map(r => {
    const checked = PatientsImportState.selectedCID.has(r.CID)
      ? "checked"
      : "";

    return `
      <tr>
        <td class="text-center">
          <input type="checkbox" ${checked}
            onchange="togglePatientSelect('${r.CID}', this.checked)">
        </td>
        <td>${r.CID}</td>
        <td>${r.NAME} ${r.LNAME}</td>
        <td>${r.BIRTH_THAI}</td>
        <td>${r.MOBILE || r.TELEPHONE}</td>
      </tr>
    `;
  }).join("");
}

/* =========================================================
   SELECT
========================================================= */
function togglePatientSelect(cid, checked) {
  checked
    ? PatientsImportState.selectedCID.add(cid)
    : PatientsImportState.selectedCID.delete(cid);

  updateCounter();
}

/* =========================================================
   COUNTER
========================================================= */
function updateCounter() {
  const el = document.getElementById("patientsImportCounter");
  if (!el) return;

  el.innerText =
    `แสดง ${Math.min(
      PatientsImportState.filteredRows.length,
      PatientsImportState.MAX_RENDER
    )} / ${PatientsImportState.filteredRows.length} | ` +
    `เลือก ${PatientsImportState.selectedCID.size}`;
}

/* =========================================================
   SAVE (BATCH → SERVICE SCHEMA MATCH)
========================================================= */
function bindSave() {
  const btn = document.getElementById("btnSavePatients");
  if (!btn) return;

  btn.onclick = async () => {

    /* ===============================
       1) ตรวจว่ามีข้อมูลเลือกไหม
    =============================== */
    if (!PatientsImportState.selectedCID.size) {
      Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้เลือกข้อมูล",
        text: "กรุณาเลือกข้อมูลก่อนบันทึก",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    const payload = PatientsImportState.allRows.filter(r =>
      PatientsImportState.selectedCID.has(r.CID)
    );

    console.log("PAYLOAD TYPE:", Array.isArray(payload));
    console.log("PAYLOAD LENGTH:", payload.length);
    console.log("PAYLOAD SAMPLE:", payload[0]);

    /* ===============================
       2) Confirm ก่อนบันทึก
    =============================== */
    const confirm = await Swal.fire({
      icon: "question",
      title: "ยืนยันการบันทึก",
      html: `ต้องการบันทึกข้อมูล <b>${payload.length}</b> รายการ ใช่หรือไม่ ?`,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    /* ===============================
       3) Loading
    =============================== */
    Swal.fire({
      title: "กำลังบันทึกข้อมูล",
      text: "กรุณารอสักครู่...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch("/api/patients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "บันทึกไม่สำเร็จ");
      }

      /* ===============================
         4) Success
      =============================== */
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: `บันทึกข้อมูล ${payload.length} รายการเรียบร้อยแล้ว`,
        timer: 2000,
        showConfirmButton: false
      });

      PatientsImportState.selectedCID.clear();
      renderPatientsTable();
      updateCounter();

    } catch (err) {
      console.error("❌ SAVE ERROR", err);

      /* ===============================
         5) Error
      =============================== */
      Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: err.message || "เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล",
        confirmButtonText: "ตกลง"
      });
    }
  };
}


async function loadPatientsSelect() {
  const res = await fetch("/patients/list");
  const json = await res.json();

  if (!json.success) return;

  const select = document.getElementById("patientSelect");
  select.innerHTML = '<option value="">-- เลือกผู้ป่วย --</option>';

  json.data.forEach(p => {
    select.innerHTML += `
      <option value="${p.CID}">
        ${p.CID} - ${p.fullName}
      </option>
    `;
  });
}

/* =========================================================
   UI
========================================================= */
function showPatientsPreview() {
  document.getElementById("searchSection")?.classList.remove("d-none");
  document.getElementById("previewSection")?.classList.remove("d-none");
}

/* =========================================================
   MODE SWITCH (UPLOAD / MANUAL)
========================================================= */
function bindModeSwitch() {
  const btnUpload = document.getElementById("btnModeUpload");
  const btnManual = document.getElementById("btnModeManual");
  const uploadSection = document.getElementById("uploadSection");
  const manualSection = document.getElementById("manualSection");

  if (!btnUpload || !btnManual) return;

  btnUpload.onclick = () => {
    uploadSection?.classList.remove("d-none");
    manualSection?.classList.add("d-none");
  };

  btnManual.onclick = () => {
    uploadSection?.classList.add("d-none");
    manualSection?.classList.remove("d-none");
  };
}


/* =========================================================
   MANUAL ENTRY SAVE
========================================================= */
function bindManualSave() {
  const btn = document.getElementById("btnAddManual");
  if (!btn) return;

  btn.onclick = async () => {

    const CID = document.getElementById("manualCid")?.value.trim();
    const HN = document.getElementById("manualHN")?.value.trim();
    const PRENAME = document.getElementById("manualPrename")?.value;
    const NAME = document.getElementById("manualName")?.value.trim();
    const LNAME = document.getElementById("manualSurname")?.value.trim();
    const SEX = document.querySelector("input[name='manualSex']:checked")?.value || "";
    const BIRTH = document.getElementById("manualBirth")?.value;
    const TELEPHONE = document.getElementById("manualTelephone")?.value.trim();
    const MOBILE = document.getElementById("manualMobile")?.value.trim();

    /* =========================
       VALIDATION
    ========================= */
    if (!CID || CID.length !== 13) {
      return Swal.fire("กรุณากรอกเลขบัตร 13 หลัก");
    }

    if (!NAME || !LNAME) {
      return Swal.fire("กรุณากรอกชื่อและนามสกุล");
    }

    const payload = [{
      CID,
      PRENAME,
      NAME,
      LNAME,
      HN,
      SEX,
      BIRTH: BIRTH ? BIRTH.replace(/-/g,"") : "",
      BIRTH_THAI: BIRTH ? toDisplayThaiDate(BIRTH) : "",
      TELEPHONE,
      MOBILE
    }];

    try {

      Swal.fire({
        title: "กำลังบันทึก...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await fetch("/api/patients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!json.success) throw new Error(json.message);

      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        timer: 1500,
        showConfirmButton: false
      });

      document.querySelectorAll("#manualSection input").forEach(i => i.value = "");
      document.querySelectorAll("input[name='manualSex']").forEach(r => r.checked = false);

    } catch (err) {
      console.error(err);
      Swal.fire("บันทึกไม่สำเร็จ");
    }
  };
}







/* =========================================================
   EXPORT
========================================================= */
window.initPatients = initPatients;
window.togglePatientSelect = togglePatientSelect;
