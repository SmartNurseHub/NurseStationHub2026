console.log("🔥 nursingRecords.client.js LOADED");

/* =================================================
   BOOTSTRAP
================================================= */
bindOpenTabEvents();
console.log("🧷 nursingRecords tabs bound");

/* =================================================
   SCRIPT LOADER (LOAD ONCE)
================================================= */
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();

    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

/* =================================================
   CORE LOADER (LOAD ONCE)
================================================= */
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

/* =================================================
   TABLE VISIBILITY / MOVE (ONLINE ONLY)
================================================= */
function hideNursingTable() {
  const el = document.getElementById("listTableContainer");
  if (el) el.style.display = "none";
}

function showNursingTable() {
  const el = document.getElementById("listTableContainer");
  if (el) el.style.display = "block";
}

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

/* =================================================
   SUBVIEW LOADER (SPA CORE)
================================================= */
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

  /* 1️⃣ load view */
  container.innerHTML = "⏳ กำลังโหลด...";
  const res = await fetch(viewUrl);
  container.innerHTML = await res.text();

  /* 2️⃣ table behavior */
  if (tab === "online") {
    showNursingTable();
    moveNursingTableToForm();
  }

  if (tab === "counselor") {
    hideNursingTable();
  }

  /* 3️⃣ core + utils */
  await loadCoreOnce();
  await loadScriptOnce("/assets/js/date.utils.js");

  /* 4️⃣ actions + client */
  await loadScriptOnce(actionsUrl);
  await loadScriptOnce(clientUrl);

  /* 5️⃣ init */
  if (typeof window[initFn] === "function") {
    window[initFn]();
    console.log(`✅ ${initFn}() called`);
  }

  /* 6️⃣ bind extra (online only) */
  if (tab === "online" && window.NursingOnlineActions) {
    NursingOnlineActions.bindPatientSearch?.();
  }
}

/* =================================================
   TAB EVENTS
================================================= */
function bindOpenTabEvents() {
  document.body.addEventListener("click", e => {
    const btn = e.target.closest(".open-tab");
    if (!btn) return;

    e.preventDefault();
    loadSubView(btn.dataset.tab);
  });
}

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
async function ensurePrintReady() {
  // 1️⃣ โหลด date utils ก่อน
  await loadScriptOnce("/assets/js/date.utils.js");

  // 2️⃣ โหลด print module
  await loadScriptOnce("/modules/nursingRecords/nursingRecords.print.js");

  // 3️⃣ เช็กความพร้อม (กันพลาด)
  if (typeof window.printRecord !== "function") {
    throw new Error("printRecord not available");
  }
}

async function handlePrint(r) {
  try {
    await ensurePrintReady();
    window.printRecord(r);
  } catch (err) {
    console.error("❌ PRINT FAILED", err);

    Swal.fire({
      icon: "error",
      title: "ไม่สามารถพิมพ์ได้",
      text: "ระบบพิมพ์เอกสารยังไม่พร้อม",
    });
  }
}

/* expose */
window.handlePrint = handlePrint;

/* =================================================
   MAIN TABLE INIT (PAGE LOAD)
================================================= */
(async () => {
  console.log("🚀 INIT MAIN NURSING TABLE");

  await loadScriptOnce("/modules/nursingRecords/nursingRecords.print.js");
  await loadScriptOnce("/modules/nursingRecords/nursingRecords.online.actions.js");

  if (window.NursingOnlineActions) {
    NursingOnlineActions.loadNursingRecords();
    NursingOnlineActions.bindTableActions();
  }
})();

/* =================================================
   GLOBAL UTIL : DELETE RECORD (KEEP ORIGINAL LOGIC)
================================================= */
async function deleteRecord(nsr) {
  console.log("🗑️ DELETE CLICKED", nsr);

  if (!confirm(`ยืนยันลบรายการ ${nsr} ?`)) return;

  try {
    const res = await fetch(`/api/nursingRecords/${nsr}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());

    console.log("✅ DELETE SUCCESS", nsr);

    if (window.NursingOnlineActions) {
      NursingOnlineActions.loadNursingRecords();
    }

  } catch (err) {
    console.error("❌ DELETE FAILED", err);
    alert("ลบข้อมูลไม่สำเร็จ");
  }
}

window.deleteRecord = deleteRecord;
