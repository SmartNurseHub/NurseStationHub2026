console.log("🔥 nursingRecords.client.js LOADED");

/* ================================
   SPA BOOTSTRAP
================================ */
bindOpenTabEvents();
console.log("🧷 nursingRecords tabs bound");

/* ================================
   SCRIPT LOADER
================================ */
// 🔧 เพิ่มโค้ด (2026-01-29 23:05)
// ฟังก์ชันนี้จำเป็นสำหรับ dynamic load script
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

/* ================================
   SUBVIEW LOADER
================================ */
async function loadSubView(tab) {
  const container = document.getElementById("nursingRecordsContainer");
  if (!container) return;

  let viewUrl = "";
  let actionsUrl = "";
  let clientUrl = "";
  let initFn = "";

  if (tab === "online") {
    viewUrl    = "/modules/nursingRecords/views/nursingRecords.online.view.html";
    actionsUrl = "/modules/nursingRecords/nursingRecords.online.actions.js";
    clientUrl  = "/modules/nursingRecords/nursingRecords.online.client.js";
    initFn     = "initNursingRecordsOnline";
  }

  if (tab === "counselor") {
    viewUrl    = "/modules/nursingRecords/views/nursingRecords.counselor.view.html";
    actionsUrl = "/modules/nursingRecords/nursingRecords.counselor.actions.js";
    clientUrl  = "/modules/nursingRecords/nursingRecords.counselor.client.js";
    initFn     = "initNursingRecordsCounselor";
  }

  /* 1️⃣ โหลด view */
  container.innerHTML = "⏳ กำลังโหลด...";
  const res = await fetch(viewUrl);
  container.innerHTML = await res.text();

  /* 🔧 ปรับปรุง (2026-01-29 22:40)
     ย้าย table ตาม tab */
  if (tab === "online") {
    moveNursingTableToForm();
  } else {
    moveNursingTableToList();
  }

  /* 2️⃣ โหลด core */
  await loadCoreOnce();

  /* 3️⃣ utils */
  await loadScriptOnce("/assets/js/date.utils.js");

  /* 4️⃣ actions */
  await loadScriptOnce(actionsUrl);

  /* 5️⃣ client */
  await loadScriptOnce(clientUrl);

  /* 6️⃣ init */
  if (typeof window[initFn] === "function") {
  window[initFn]();
  console.log(`✅ ${initFn}() called`);
}
/* 🔥 BIND FORM SUBMIT (ต้องอยู่หลัง view โหลดแล้วเท่านั้น) */
if (tab === "online") {
  const form = document.getElementById("nursingForm");

  if (form && !form.__bound__) {
    form.__bound__ = true;

    form.addEventListener("submit", async (e) => {
      e.preventDefault(); // 🔥 หยุด browser submit

      console.log("💾 FORM SUBMIT intercepted");

      const nsr = document.getElementById("NSR")?.value;

    });

    console.log("📝 nursingForm submit bound");
  }
}



  /* 🔧 เพิ่มโค้ด (2026-01-29 22:40)
     bind search หลัง online view โหลดแล้ว */
  if (tab === "online" && window.NursingOnlineActions) {
    NursingOnlineActions.bindPatientSearch();
  }
}

/* ================================
   EVENTS
================================ */
function bindOpenTabEvents() {
  document.body.addEventListener("click", e => {
    const btn = e.target.closest(".open-tab");
    if (!btn) return;

    e.preventDefault();
    loadSubView(btn.dataset.tab);
  });
}

/* ================================
   CORE LOADER
================================ */
window.__patientCoreLoaded__ = window.__patientCoreLoaded__ || false;

function loadCoreOnce() {
  if (window.__patientCoreLoaded__) return Promise.resolve();

  return new Promise(resolve => {
    const s = document.createElement("script");
    s.src = "/modules/patientCore/patientCore.client.js";
    s.onload = () => {
      window.__patientCoreLoaded__ = true;
      console.log("🧠 patientCore loaded");
      resolve();
    };
    document.body.appendChild(s);
  });
}

/* ================================
   TABLE MOVE
================================ */
function moveNursingTableToForm() {
  const table = document.getElementById("listTableContainer");
  const target = document.getElementById("tableBottomContainer");
  if (table && target) target.appendChild(table);
}

function moveNursingTableToList() {
  const table = document.getElementById("listTableContainer");
  const main = document.querySelector("#nursingRecordsContainer").previousElementSibling;
  if (table && main) main.after(table);
}

/* ================================
   INIT MAIN TABLE
================================ */

/* ================================
   GLOBAL UTILS (LOAD ONCE)
================================ */
async function deleteRecord(nsr) {
  if (!nsr) return;

  if (!confirm(`ยืนยันลบรายการ ${nsr} ?`)) return;

  try {
    const res = await fetch(`/api/nursingRecords/${nsr}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "delete failed");

    Swal.fire({
  title: "ยืนยันการลบ?",
  text: "ข้อมูลนี้จะไม่สามารถกู้คืนได้",
  icon: "warning",
  showCancelButton: true,
  confirmButtonText: "ลบ",
  cancelButtonText: "ยกเลิก",
}).then(result => {
  if (result.isConfirmed) {
    deleteRecord(nsr);
  }
});


    // reload table
    if (window.NursingOnlineActions) {
      NursingOnlineActions.loadNursingRecords();
    }

  } catch (err) {
    console.error("❌ DELETE ERROR", err);

Swal.fire({
  toast: true,
  position: "top-end",
  icon: "error",
  title: "ไม่สามารถลบรายการได้",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true
});

  }
}

/* expose */
window.deleteRecord = deleteRecord;



(async () => {
  await loadScriptOnce("/assets/js/date.utils.js");
  console.log("📅 date.utils.js ready (global)");
})();


(async () => {
  console.log("🚀 INIT MAIN NURSING TABLE");
  await loadScriptOnce("/modules/nursingRecords/nursingRecords.online.actions.js");

  if (window.NursingOnlineActions) {
    NursingOnlineActions.loadNursingRecords();
    NursingOnlineActions.bindTableActions();
  }
})();


/* =================================================
   PRINT STICKER
================================================= */
function printRecord(r) {
  console.log("🖨️ PRINT CLICKED", r);
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


async function deleteRecord(nsr) {
  console.log("🗑️ DELETE CLICKED", nsr);

  if (!confirm(`ยืนยันลบรายการ ${nsr} ?`)) return;

  try {
    const res = await fetch(`/api/nursingRecords/${nsr}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    console.log("✅ DELETE SUCCESS", nsr);

    // reload table
    if (window.NursingOnlineActions) {
      NursingOnlineActions.loadNursingRecords();
    }

  } catch (err) {
    console.error("❌ DELETE FAILED", err);
    alert("ลบข้อมูลไม่สำเร็จ");
  }
}

/* 🔥 expose ให้ปุ่ม onclick เรียกได้ */
window.deleteRecord = deleteRecord;


