/*************************************************
 * modules/nursingRecords/nursingRecords.client.js
 *************************************************/
console.log("🔥 nursingRecords.client.js LOADED");

/* =================================================
   STATE (SPA SAFE)
================================================= */
window.__NR_PATIENT_SEARCH__ = window.__NR_PATIENT_SEARCH__ || {
  lastKeyword: ""
};

let __NR_EDIT_MODE__ = false;
let __NR_EDIT_NSR__ = null;

/* =================================================
   INIT
================================================= */
function initNursingRecords() {
  console.log("📝 Nursing Records initialized");

  bindTabs();
  bindFormSubmit();
  bindPatientSearch();
  moveTable("top");
  loadNextNSR();
  loadNursingRecords();
}

/* =================================================
   DATE UTIL (RAW vs DISPLAY)
================================================= */

function toRawDate(dateStr) {
  if (!dateStr) return "";

  // ✅ บังคับเป็น string เสมอ
  const s = String(dateStr).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  // YYYYMMDD
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  }

  return "";
}


// raw → display (ไทย)
function toDisplayThaiDate(raw) {
  if (!raw) return "";

  const s = toRawDate(raw);
  if (!s) return "";

  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return "";

  const thaiMonths = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
    "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
    "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
  ];

  if (!thaiMonths[m - 1]) return "";

  return `${d} ${thaiMonths[m - 1]} ${y + 543}`;
}



function formatPrename(code) {
  const map = {
    "1": "เด็กชาย",
    "2": "เด็กหญิง",
    "3": "นาย",
    "4": "นางสาว",
    "5": "นาง"
  };
  return map[String(code)] || "";
}

function calculateAge(rawDate) {
  if (!rawDate) return "";

  // rawDate คาดว่าเป็น YYYYMMDD หรือ YYYY-MM-DD
  let birth;
  if (/^\d{8}$/.test(rawDate)) {
    birth = new Date(
      rawDate.slice(0, 4),
      rawDate.slice(4, 6) - 1,
      rawDate.slice(6, 8)
    );
  } else {
    birth = new Date(rawDate);
  }

  if (isNaN(birth)) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}


/* =================================================
   TAB CONTROL
================================================= */
function bindTabs() {
  document.querySelectorAll(".open-tab").forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();
      showTab(btn.dataset.targetTab);
    };
  });
}

function showTab(name) {
  document.querySelectorAll(".nr-tab-panel").forEach(p => {
    p.style.display = p.dataset.tab === name ? "block" : "none";
  });

  // ✅ ถ้าเปิดฟอร์ม
  if (name === "online") {
    moveTable("bottom");
  }
}


/* =================================================
   FORM SUBMIT (CREATE / UPDATE)
================================================= */
function bindFormSubmit() {
  const form = document.getElementById("nursingForm");
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    data.Stamp = new Date().toISOString();

    const isEdit = __NR_EDIT_MODE__ && __NR_EDIT_NSR__;
    const url = isEdit
      ? `/api/nursingRecords/${__NR_EDIT_NSR__}`
      : `/api/nursingRecords`;

    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw await res.json();

      alert(isEdit ? "✅ แก้ไขข้อมูลแล้ว" : "✅ บันทึกข้อมูลแล้ว");

      resetForm();
      hidePatientResults();
      await loadNextNSR();
      loadNursingRecords();

    } catch (err) {
      console.error(err);
      alert("❌ บันทึกไม่สำเร็จ");
    }
  };
}

function resetForm() {
  const form = document.getElementById("nursingForm");
  if (form) form.reset();

  __NR_EDIT_MODE__ = false;
  __NR_EDIT_NSR__ = null;
}

/* =================================================
   LOAD NEXT NSR
================================================= */
async function loadNextNSR() {
  if (__NR_EDIT_MODE__) return;

  const input = document.getElementById("NSR");
  if (!input) return;

  try {
    const res = await fetch("/api/nursingRecords/next-nsr");
    const data = await res.json();
    input.value = data.nsr || "";
  } catch (err) {
    console.error("❌ loadNextNSR error:", err);
    input.value = "";
  }
}

/* =================================================
   PATIENT SEARCH
================================================= */
function bindPatientSearch() {
  const btn = document.getElementById("btnSearchPatient");
  const input = document.getElementById("patientSearch");
  const resultBox = document.getElementById("searchResults");

  if (!btn || !input || !resultBox) return;

  input.oninput = () => searchPatient(input.value.trim());
  btn.onclick = e => {
    e.preventDefault();
    searchPatient(input.value.trim());
  };
}

/* =================================================
   SEARCH CORE
================================================= */
async function searchPatient(keyword) {
  const box = document.getElementById("searchResults");
  if (!keyword) return hidePatientResults();

  try {
    const res = await fetch(
      `/api/patients/search?q=${encodeURIComponent(keyword)}`
    );
    const result = await res.json();

    if (!Array.isArray(result.data) || !result.data.length) {
      box.innerHTML =
        `<div class="list-group-item text-muted">ไม่พบข้อมูล</div>`;
      box.style.display = "block";
      return;
    }

    box.innerHTML = "";
    result.data.forEach(p => {
      const btn = document.createElement("button");
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = `${p.HN || "-"} | ${p.NAME} ${p.LNAME}`;
      btn.onclick = () => selectPatient(p);
      box.appendChild(btn);
    });

    box.style.display = "block";
  } catch (err) {
    console.error(err);
  }
}

function normalizePhone(phone) {
  if (!phone) return "";
  let s = String(phone).trim();
  if (/^\d{9}$/.test(s)) s = "0" + s;
  return s;
}

/* =================================================
   SELECT PATIENT
================================================= */
function selectPatient(p) {
  const map = {
    patientSearch: `${p.NAME} ${p.LNAME}`,
    CID: p.CID,
    HN: p.HN,
    PRENAME: formatPrename(p.PRENAME),
    NAME: p.NAME,
    LNAME: p.LNAME,
    // ✅ ใช้ p ไม่ใช่ r
    BIRTH: toRawDate(p.BIRTH),

    TELEPHONE: normalizePhone(p.TELEPHONE || p.MOBILE)
  };

  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  hidePatientResults();
}


function hidePatientResults() {
  const box = document.getElementById("searchResults");
  if (box) box.style.display = "none";
}

/* =================================================
   LOAD TABLE  ✅ FIX ตาม backend จริง
================================================= */
async function loadNursingRecords() {
  const tbody = document.getElementById("nursingTableBody");
  if (!tbody) return;

  tbody.innerHTML =
    `<tr><td colspan="7" class="text-center">⏳ กำลังโหลดข้อมูล...</td></tr>`;

  try {
    const res = await fetch("/api/nursingRecords");
    const json = await res.json();

    const rows = (json.data || []).filter(
      r => r.status !== "INACTIVE"
    );

    if (!rows.length) {
      tbody.innerHTML =
        `<tr><td colspan="7" class="text-center text-muted">ไม่มีข้อมูล</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td style="width:8%;">${r.NSR || "-"}</td>

        <!-- วันที่ให้บริการ -->
        <td style="width:8%;">${toDisplayThaiDate(r.DateService) || "-"}</td>

        <td style="width:6%;">${r.HN || "-"}</td>

        <!-- ชื่อ-สกุล -->
        <td style="width:15%;">
          ${r.PRENAME || ""}${r.NAME || ""} ${r.LNAME || ""}
        </td>

        <td style="width:20%;">${r.Activity || "-"}</td>
        <td style="width:14%;">${r.Provider1 || "-"}</td>

        <td style="width:8%;" class="text-center">
  <button class="btn btn-warning btn-sm px-1 py-0"
    onclick='editRecord(${JSON.stringify(r)})'>✏️</button>

  <button class="btn btn-danger btn-sm px-1 py-0 ms-1"
    onclick="deleteRecord('${r.NSR}')">🗑️</button>

  <button class="btn btn-info btn-sm px-1 py-0 ms-1"
    onclick='printRecord(${JSON.stringify(r)})'>🖨️</button>
</td>

      </tr>
    `).join("");

  } catch (err) {
    console.error("❌ loadNursingRecords error:", err);
    tbody.innerHTML =
      `<tr><td colspan="7" class="text-center text-danger">
        โหลดข้อมูลไม่สำเร็จ
      </td></tr>`;
  }
}


/* =================================================
   EDIT (AUTO FILL ครบ follow1–3)
================================================= */
function editRecord(r) {
  __NR_EDIT_MODE__ = true;
  __NR_EDIT_NSR__ = r.NSR;

  const map = {
  NSR: r.NSR,
  Stamp: r.Stamp, 
  CID: r.CID,
  HN: r.HN,
  PRENAME: r.PRENAME,
  NAME: r.NAME,
  LNAME: r.LNAME,
  BIRTH: toRawDate(r.BIRTH),
  TELEPHONE: r.TELEPHONE,
  DateService: r.DateService,
  Activity: r.Activity,
  Objective: r.Objective,
  HealthInform: r.HealthInform,
  HealthAdvice: r.HealthAdvice,

  Follow1Date: r.Follow1Date,
  Follow1Time: r.Follow1Time,
  Follow1Route: r.Follow1Route,
  Provider1: r.Provider1,
  Response1: r.Response1,

  Follow2Date: r.Follow2Date,
  Follow2Time: r.Follow2Time,
  Follow2Route: r.Follow2Route,
  Provider2: r.Provider2,
  Response2: r.Response2,

  Follow3Date: r.Follow3Date,
  Follow3Time: r.Follow3Time,
  Follow3Route: r.Follow3Route,
  Provider3: r.Provider3,
  Response3: r.Response3
};


  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  });

  showTab("online");
}

function formatBirth(b) {
  if (!b || String(b).length !== 8) return b || "";
  return `${b.slice(6,8)}/${b.slice(4,6)}/${b.slice(0,4)}`;
}

/* =================================================
   DELETE (SOFT DELETE)
================================================= */
async function deleteRecord(nsr) {
  if (!nsr) return;

  const ok = confirm(`ยืนยันลบรายการ NSR: ${nsr} ?`);
  if (!ok) return;

  try {
    const res = await fetch(`/api/nursingRecords/${nsr}`, {
      method: "DELETE"
    });

    if (!res.ok) throw await res.json();

    alert("✅ ลบข้อมูลแล้ว");
    loadNursingRecords();

  } catch (err) {
    console.error(err);
    alert("❌ ลบข้อมูลไม่สำเร็จ");
  }
}

/* =================================================
   PRINT STICKER
================================================= */
function printRecord(r) {
  const tpl = `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>Print Sticker</title>

<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap" rel="stylesheet">

<style>
@page { size: 90mm 60mm; margin: 3mm; }
body { margin:0; font-family:'Sarabun',Tahoma,sans-serif; }
.sticker { width:90mm; height:60mm; padding:2mm; box-sizing:border-box; }
.header { text-align:center; font-size:10px; }
.row { font-size:8px; margin-bottom:2px; }
hr { margin:2px 0; border-top:1px solid #000; }
table { width:100%; font-size:6px; border-collapse:collapse; }
td,th { border:1px solid #000; padding:2px; }
</style>
</head>

<body onload="window.print(); window.close();">
<div class="sticker">

<div class="header">
  <table width="100%" cellpadding="4">
    <tr>
      <!-- ส่วนที่ 1 : Logo -->
      <td width="10%" align="left"><img src="/assets/images/LOGO.png" alt="LOGO" height="30"></td>

      <td width="60%" align="center">
  <b style="font-size:10px;">บันทึกการพยาบาลออนไลน์</b><br>
  <span style="font-size:8px;">มิตรไมตรีคลินิกเวชกรรม สาขาเขาน้อย</span>
</td>
      <!-- ส่วนที่ 3 : ช่องว่าง / ข้อมูลอื่น -->
      <td width="30%" align="left">
  <b style="font-size:8px;">NSR:</b>
  <span style="font-weight:normal;font-size:8px;">${r.NSR || ""}</span>
  &nbsp;&nbsp;
  <b style="font-size:8px;">วันที่:</b>
  <span style="font-weight:normal;font-size:8px;">
    ${toDisplayThaiDate(r.DateService) || ""}
  </span>
</td>
    </tr>
  </table>
</div>


<hr>

<div style="font-size:8px;">
  <b>HN:</b> <span style="font-weight:normal; font-size:8px;">${r.HN || ""}</span> &nbsp;&nbsp;
  <b>ชื่อ-นามสกุล:</b> <span style="font-weight:normal; font-size:8px;">${r.PRENAME || ""}${r.NAME || ""} ${r.LNAME || ""}</span> &nbsp;&nbsp;
  <b>โทรศัพท์:</b> <span style="font-weight:normal; font-size:8px;">${r.TELEPHONE || ""}</span>
  
</div>

<div style="font-size:8px;">
  <b>เลขบัตรประชาชน:</b> <span style="font-weight:normal; font-size:8px;">${r.CID || ""}</span>&nbsp;&nbsp;
  <b>วันเกิด:</b> <span style="font-weight:normal; font-size:8px;">${toDisplayThaiDate(toRawDate(r.BIRTH))} (${calculateAge(toRawDate(r.BIRTH))} ปี)</span>
</div>

<hr>

<div class="row"><b>กิจกรรม:</b><br>${r.Activity || ""}</div>
<div class="row"><b>วัตถุประสงค์:</b><br>${r.Objective || ""}</div>
<div class="row"><b>ข้อมูลสุขภาพ:</b><br>${r.HealthInform || ""}</div>
<div class="row"><b>คำแนะนำ:</b><br>${r.HealthAdvice || ""}</div>

<hr>
<div style="page-break-before: always;"></div>
<b style="font-size:8px;">บันทึกการติดตามผู้รับบริการ</b>
<br>

<table border="1" width="100%" cellspacing="0" cellpadding="4" style="font-size:7px;">

  <colgroup>
    <col width="6%">
    <col width="15%">
    <col width="12%">
    <col width="44%">
    <col width="23%">
  </colgroup>

  <thead>
    <tr>
      <th>ครั้ง</th>
      <th>วันที่ / เวลา</th>
      <th>ช่องทาง</th>
      <th>การประเมินผล</th>
      <th>ผู้ให้บริการ</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td align="center"valign="top">1</td>
      <td align="center" valign="top">${r.Follow1Date || ""}<br>${r.Follow1Time || ""}</td>
      <td align="center" valign="top">${r.Follow1Route || ""}</td>
      <td align="left" valign="top">${r.Response1 || ""}</td>
      <td align="center"><br><br>${r.Provider1 || ""}</td>
    </tr>

    <tr>
      <td align="center"valign="top">2</td>
      <td align="center" valign="top">${r.Follow2Date || ""}<br>${r.Follow2Time || ""}</td>
      <td align="center" valign="top">${r.Follow2Route || ""}</td>
      <td align="left" valign="top">${r.Response2 || ""}</td>
      <td align="center"><br><br>${r.Provider2 || ""}</td>
    </tr>

    <tr>
      <td align="center" valign="top">3</td>
      <td align="center" valign="top">${r.Follow3Date || ""}<br>${r.Follow3Time || ""}</td>
      <td align="center" valign="top">${r.Follow3Route || ""}</td>
      <td align="left" valign="top">${r.Response3 || ""}</td>
      <td align="center"><br><br>${r.Provider3 || ""}</td>
    </tr>
  </tbody>
</table>


</div>
</body>
</html>
`;

  const w = window.open("", "_blank", "width=400,height=600");
  w.document.write(tpl);
  w.document.close();
}


function moveTable(position) {
  const table = document.getElementById("nursingTableSection");
  if (!table) return;

  const top = document.getElementById("tableTopContainer");
  const bottom = document.getElementById("tableBottomContainer");

  if (position === "top" && top) {
    top.appendChild(table);
  }

  if (position === "bottom" && bottom) {
    bottom.appendChild(table);
  }
}


/* =================================================
   EXPORT
================================================= */
window.initNursingRecords = initNursingRecords;
