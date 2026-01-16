/*****************************************************************
 * nursing.js
 * Frontend logic สำหรับ VIEW : Nursing Records
 * รองรับ SPA auto-init จาก app.js
 *****************************************************************/

let nursingRecords = [];
let editingNSR = null;

/* =========================================================
   INIT (ถูกเรียกโดย navTo → init_nursingRecords)
========================================================= */
window.init_nursingRecords = function () {
  console.log("👩‍⚕️ init_nursingRecords");

  bindTabControl();
  bindPatientSearch();
  bindNursingForm();
  loadNursingRecords();
  bindTextareaSuggestion();
};

/* =========================================================
   TAB CONTROL
========================================================= */
function bindTabControl() {
  document.querySelectorAll(".open-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.targetTab;
      document.querySelectorAll(".nr-tab-panel")
        .forEach(p => p.style.display = "none");

      const panel = document.querySelector(`.nr-tab-panel[data-tab="${target}"]`);
      if (panel) panel.style.display = "block";
    });
  });
}

/* =========================================================
   PATIENT SEARCH
========================================================= */
function bindPatientSearch() {
  const input = document.getElementById("patientSearch");
  const btn = document.getElementById("btnSearchPatient");
  const resultBox = document.getElementById("searchResults");

  if (!input || !btn || !resultBox) return;

  btn.addEventListener("click", async () => {
    const q = input.value.trim();
    if (!q) return;

    const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
    const data = await res.json();

    resultBox.innerHTML = "";
    resultBox.style.display = "block";

    data.forEach(p => {
      const item = document.createElement("a");
      item.className = "list-group-item list-group-item-action";
      item.textContent = `${p.CID} | ${p.NAME} ${p.LNAME}`;
      item.addEventListener("click", () => fillPatient(p));
      resultBox.appendChild(item);
    });
  });

  function fillPatient(p) {
    ["HN","CID","NAME","LNAME","TELEPHONE"].forEach(k => {
      const el = document.getElementById(k);
      if (el) el.value = p[k] || "";
    });
    resultBox.style.display = "none";
  }
}

/* =========================================================
   FORM SUBMIT
========================================================= */
function bindNursingForm() {
  const form = document.getElementById("nursingForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.NSR = editingNSR || payload.NSR;

    const res = await fetch("/api/nursing/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    alert(result.message || "บันทึกสำเร็จ");

    editingNSR = null;
    form.reset();
    loadNursingRecords();
  });
}

/* =========================================================
   LOAD TABLE
========================================================= */
async function loadNursingRecords() {
  const res = await fetch("/api/nursing");
  nursingRecords = await res.json();

  const tbody = document.getElementById("nursingTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  nursingRecords.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.NSR || ""}</td>
      <td>${r.DateService || ""}</td>
      <td>${r.HN || ""}</td>
      <td>${r.NAME || ""} ${r.LNAME || ""}</td>
      <td>${r.Activity || ""}</td>
      <td>${r.Provider1 || ""}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-warning">✏️</button>
        <button class="btn btn-sm btn-danger">🗑</button>
      </td>
    `;
    tr.querySelector(".btn-warning").onclick = () => editRecord(r.NSR);
    tr.querySelector(".btn-danger").onclick = () => deleteRecord(r.NSR);
    tbody.appendChild(tr);
  });
}

/* =========================================================
   EDIT / DELETE
========================================================= */
function editRecord(nsr) {
  const r = nursingRecords.find(x => x.NSR === nsr);
  if (!r) return;

  editingNSR = nsr;
  Object.keys(r).forEach(k => {
    const el = document.getElementById(k);
    if (el) el.value = r[k];
  });

  const panel = document.querySelector(`.nr-tab-panel[data-tab="online"]`);
  if (panel) panel.style.display = "block";
}

async function deleteRecord(nsr) {
  if (!confirm("ยืนยันลบรายการนี้?")) return;
  await fetch(`/api/nursing/${nsr}`, { method: "DELETE" });
  loadNursingRecords();
}

/* =========================================================
   TEXTAREA SUGGESTION
========================================================= */
function bindTextareaSuggestion() {
  const box = document.getElementById("textarea-suggest");
  if (!box) return;

  document.querySelectorAll("textarea[data-type]").forEach(t => {
    t.addEventListener("focus", () => showSuggest(t));
    t.addEventListener("blur", () => setTimeout(() => box.style.display = "none", 200));
  });

  function showSuggest(target) {
    const presets = {
      inform: ["ผู้ป่วยรู้สึกตัวดี", "ไม่มีอาการผิดปกติ"],
      advice: ["แนะนำรับประทานยาให้ครบ", "ติดตามอาการ 7 วัน"],
      provider: ["RN A", "RN B"],
      response: ["อาการดีขึ้น", "ต้องติดตามต่อ"]
    };

    box.innerHTML = "";
    (presets[target.dataset.type] || []).forEach(txt => {
      const item = document.createElement("a");
      item.className = "list-group-item list-group-item-action";
      item.textContent = txt;
      item.onclick = () => {
        target.value = txt;
        box.style.display = "none";
      };
      box.appendChild(item);
    });

    const rect = target.getBoundingClientRect();
    box.style.top = rect.bottom + "px";
    box.style.left = rect.left + "px";
    box.style.display = "block";
  }
}
