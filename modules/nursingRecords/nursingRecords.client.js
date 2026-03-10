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
   TABLE VISIBILITY / MOVE
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

  /* load view */
  container.innerHTML = "⏳ กำลังโหลด...";
  const res = await fetch(viewUrl);
  container.innerHTML = await res.text();

  /* table behavior */
  if (tab === "online") {
    showNursingTable();
    moveNursingTableToForm();
  }

  if (tab === "counselor") {
    hideNursingTable();
  }

  /* load core */
  await loadCoreOnce();
  await loadScriptOnce("/assets/js/date.utils.js");

  /* load actions */
  await loadScriptOnce(actionsUrl);
  await loadScriptOnce(clientUrl);

  /* init */
  if (typeof window[initFn] === "function") {
    window[initFn]();
    console.log(`✅ ${initFn}() called`);
  }

  /* textarea suggest */
setTimeout(() => {
  bindTextareaSuggest();
}, 0);

  /* online extra */
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

/* =================================================
   PRINT
================================================= */
async function ensurePrintReady() {

  await loadScriptOnce("/assets/js/date.utils.js");
  await loadScriptOnce("/modules/nursingRecords/nursingRecords.print.js");

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

window.handlePrint = handlePrint;

/* =================================================
   TABLE INIT
================================================= */
(async () => {

  console.log("🚀 INIT MAIN NURSING TABLE");

  await loadScriptOnce("/modules/nursingRecords/nursingRecords.print.js");
  await loadScriptOnce("/modules/nursingRecords/nursingRecords.online.actions.js");

  if (window.NursingOnlineActions) {

    await NursingOnlineActions.loadNursingRecords();

    NursingOnlineActions.bindTableActions();

  }

  bindSendResultButton();

})();

/* =================================================
   DELETE RECORD
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

/* =================================================
   SEND RESULT BUTTON
================================================= */
function bindSendResultButton() {

  const table = document.getElementById("listTableContainer");

  if (!table) return;

  table.addEventListener("click", async (e) => {

    const btn = e.target.closest(".action-send");

    if (!btn) return;

    const nsr = btn.dataset.nsr;

    if (!nsr) return;

    const confirmResult = await Swal.fire({
      title: "ยืนยันการส่งผลตรวจ?",
      text: "ระบบจะส่งผลตรวจให้ผู้ป่วยผ่าน LINE OA",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ส่งเลย",
      cancelButtonText: "ยกเลิก"
    });

    if (!confirmResult.isConfirmed) return;

    try {

      btn.disabled = true;

      const res = await fetch("/api/lineoa/send-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nsr })
      });

      const data = await res.json();

      if (data.success) {

        Swal.fire({
          icon: "success",
          title: "ส่งผลเรียบร้อย"
        });

      } else {

        Swal.fire({
          icon: "error",
          title: "ส่งไม่สำเร็จ"
        });

      }

    } catch (err) {

      console.error(err);

    } finally {

      btn.disabled = false;

    }

  });

}

/* =================================================
   TEXTAREA SUGGEST SYSTEM
================================================= */

function bindTextareaSuggest() {

  const suggestBox = document.getElementById("textarea-suggest");

  if (!suggestBox) return;

  document.querySelectorAll("textarea[data-type]").forEach(textarea => {

    textarea.addEventListener("input", () => {

      const keyword = textarea.value.toLowerCase();

      let history = JSON.parse(localStorage.getItem("nursingHistory") || "[]");

      suggestBox.innerHTML = "";

      if (!keyword) {
        suggestBox.style.display = "none";
        return;
      }

      const result = history.filter(t =>
        t.toLowerCase().includes(keyword)
      );

      if (!result.length) {
        suggestBox.style.display = "none";
        return;
      }

      result.slice(0,5).forEach(text => {

        const item = document.createElement("a");

        item.className = "list-group-item list-group-item-action";

        item.textContent = text;

        item.onclick = () => {

          textarea.value = text;

          suggestBox.style.display = "none";

        };

        suggestBox.appendChild(item);

      });

      const rect = textarea.getBoundingClientRect();

      suggestBox.style.left = rect.left + "px";
      suggestBox.style.top = rect.bottom + window.scrollY + "px";
      suggestBox.style.width = rect.width + "px";
      suggestBox.style.display = "block";

    });

  });

}

/* =================================================
   SAVE HISTORY
================================================= */
function saveNursingHistory(text) {

  if (!text) return;

  let history = JSON.parse(localStorage.getItem("nursingHistory") || "[]");

  if (!history.includes(text)) {

    history.push(text);

  }

  localStorage.setItem("nursingHistory", JSON.stringify(history));

}

document.addEventListener("click", e => {

  const box = document.getElementById("textarea-suggest");

  if (!box) return;

  if (!e.target.closest("textarea")) {
    box.style.display = "none";
  }

});