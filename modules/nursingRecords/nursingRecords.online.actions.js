/************************************************************
 * nursingRecords.online.actions.js
 ************************************************************/
console.log("⚙️ nursingRecords.online.actions.js LOADED");

/* ================================
   GLOBAL EDITOR STATE
================================ */
window.EditorState = {
  mode: "add",
  record: null,

  setAdd() {
    this.mode = "add";
    this.record = null;
  },

  setEdit(r) {
    this.mode = "edit";
    this.record = r;
  },

  clear() {
    this.mode = "add";
    this.record = null;
  }
};

window.NursingOnlineActions = (() => {

  /* ================================
     PATIENT SEARCH
  ================================ */
  function bindPatientSearch() {
    const input = document.getElementById("patientSearch");
    const resultBox = document.getElementById("searchResults");
    if (!input || !resultBox) return;

    const hideResults = () => {
      resultBox.innerHTML = "";
      resultBox.style.display = "none";
    };

    input.addEventListener("input", e => {
      const keyword = e.target.value.trim();
      if (!keyword) return hideResults();

      PatientCore.searchPatientCore(keyword, rows => {
        PatientCore.renderPatientResults(
          resultBox,
          rows,
          patient => {
            if (window.fillNursingForm) {
              window.fillNursingForm(patient);
              // 🔧 เพิ่มโค้ด (2026-01-29 22:40)
            }
            hideResults();
          }
        );
      });
    });

    input.addEventListener("blur", () => {
      setTimeout(hideResults, 200);
    });
  }

  /* ================================
     LOAD TABLE
  ================================ */
  async function loadNursingRecords() {
    const tbody = document.getElementById("nursingTableBody");
    if (!tbody) return;

    tbody.innerHTML =
      `<tr><td colspan="7" class="text-center">⏳ กำลังโหลด...</td></tr>`;

    try {
      const res  = await fetch("/api/nursingRecords");
      const json = await res.json();
      const rows = Array.isArray(json) ? json : (json.data || []);

      tbody.innerHTML = "";

      if (!rows.length) {
        tbody.innerHTML =
          `<tr><td colspan="7" class="text-center text-muted">ไม่มีข้อมูล</td></tr>`;
        return;
      }

      rows.forEach(r => {
  const tr = document.createElement("tr");
  tr._record = r;

  tr.innerHTML = `
    <td>${r.NSR || ""}</td>
    <td>${r.DateService || "-"}</td>
    <td>${r.HN || "-"}</td>
    <td>${r.NAME || ""} ${r.LNAME || ""}</td>
    <td>${r.Activity || "-"}</td>
    <td>${r.Provider1 || "-"}</td>
    <td class="text-center">
      <div class="d-flex flex-wrap justify-content-center gap-1" style="max-width:90px; margin:auto;">

        <button type="button"
          class="btn btn-warning btn-sm action-edit"
          style="width:40px;">
          ✏️
        </button>

        <button class="btn btn-sm btn-info"
          onclick='handlePrint(${JSON.stringify(r)})'
          style="width:40px;">
          🖨️
        </button>

        <button type="button"
          class="btn btn-sm btn-success action-send"
          data-nsr="${r.NSR}"
          style="width:40px;">
          📲
        </button>

        <button class="btn btn-sm btn-danger"
          onclick="deleteRecord('${r.NSR}')"
          style="width:40px;">
          🗑️
        </button>

      </div>
    </td>


  `;
  tbody.appendChild(tr);
});


    } catch (err) {
      console.error(err);
      tbody.innerHTML =
        `<tr><td colspan="7" class="text-center text-danger">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
    }
  }

  /* ================================
     TABLE ACTIONS
  ================================ */
  function bindTableActions() {
  if (window.__nursingTableBound) return;
  window.__nursingTableBound = true;

  document.body.addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest("tr");
    if (!row || !row._record) return;

    const record = row._record;

    if (btn.classList.contains("action-edit")) {
      EditorState.setEdit(record);
      loadSubView("online");
    }

    if (btn.classList.contains("action-delete")) {
      deleteRecord(record.NSR);
    }

    if (btn.classList.contains("action-print")) {
      handlePrint(record);
    }

    if (btn.classList.contains("action-send")) {
      await sendReportToPatient(record.NSR, btn);
    }

  });

  console.log("🧷 Table actions bound");
  }
  async function loadNextNSR() {
    if (EditorState.mode === "edit") return;

    const input = document.getElementById("NSR");
    if (!input) return;

    const res = await fetch("/api/nursingRecords/next-nsr");
    const json = await res.json();
    input.value = json.nsr || "";
  }


  async function sendReportToPatient(nsr, button) {

  if (!nsr) return;

  if (!confirm("ยืนยันการส่งผลให้ผู้รับบริการ?")) return;

  try {

    button.disabled = true;
    button.innerHTML = "⏳";

    const res = await fetch("/api/lineOA/sendReport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nsr })
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "ส่งไม่สำเร็จ");
    }

    button.innerHTML = "✅";
    button.classList.remove("btn-success");
    button.classList.add("btn-secondary");

    console.log("✅ ส่งผลสำเร็จ:", nsr);

  } catch (err) {

    console.error("❌ Send error:", err);
    alert("เกิดข้อผิดพลาด: " + err.message);

    button.disabled = false;
    button.innerHTML = "📲";
  }
}
  return {
    bindPatientSearch,
    bindTableActions,
    loadNursingRecords,
    loadNextNSR
  };
})();
