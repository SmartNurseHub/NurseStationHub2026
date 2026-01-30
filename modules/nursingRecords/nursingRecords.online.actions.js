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
            <button type="button" class="btn btn-warning btn-sm action-edit">✏️</button>
            <button class="btn btn-sm btn-info"
  onclick='printRecord(${JSON.stringify(r)})'>
  🖨️
</button>

            <button class="btn btn-sm btn-danger ms-1"
  onclick="deleteRecord('${r.NSR}')">🗑️</button>

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

    document.body.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const row = btn.closest("tr");
      if (!row || !row._record) return;

      if (btn.classList.contains("action-edit")) {
        EditorState.setEdit(row._record);
        loadSubView("online");
      }

      if (btn.classList.contains("action-delete")) {
        deleteRecord(row._record.NSR);
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

  return {
    bindPatientSearch,
    bindTableActions,
    loadNursingRecords,
    loadNextNSR
  };
})();
