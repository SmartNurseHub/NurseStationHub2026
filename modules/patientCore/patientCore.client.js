/************************************************************
 * MODULE : PatientCore
 * PURPOSE: Shared patient search & fill logic for all modules
 * SCOPE  : Frontend (SPA)
 ************************************************************/

console.log("🧠 PatientCore LOADED");

/* =========================================================
   PATIENT CORE (GLOBAL)
========================================================= */
window.PatientCore = {

  /* ---------------------------------
     SEARCH PATIENT (API)
  --------------------------------- */
  async searchPatientCore(keyword, callback) {
    if (!keyword || keyword.length < 1) {
      callback([]);
      return;
    }

    try {
      const res = await fetch(
        "/api/patients/search?q=" + encodeURIComponent(keyword)
      );

      const json = await res.json();

      // 🔥 รองรับทั้ง array ตรง ๆ และ { data: [] }
      const result = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
          ? json.data
          : [];

      console.log("🧪 RESULT FROM PatientCore:", result);

      callback(result);

    } catch (err) {
      console.error("❌ Patient search failed", err);
      callback([]);
    }
  },

  /* ---------------------------------
     RENDER SEARCH RESULT LIST
  --------------------------------- */
  renderPatientResults(container, data, onSelect) {
    if (!container) return;

    container.innerHTML = "";
    container.style.display = "block";

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML =
        `<div class="list-group-item small text-muted">ไม่พบข้อมูล</div>`;
      return;
    }

    data.forEach(p => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "list-group-item list-group-item-action small";
      item.textContent = `${p.HN || p.CID} : ${p.NAME} ${p.LNAME}`;
      item.onclick = () => onSelect(p);
      container.appendChild(item);
    });
  },

  /* ---------------------------------
     FILL DATA BY INPUT NAME (GENERIC)
  --------------------------------- */
  fillPatientToForms(p) {
    if (!p) return;

    const map = {
      patient_name: `${p.NAME ?? ""} ${p.LNAME ?? ""}`.trim(),
      patient_id: p.HN || p.CID || "",
      age: p.AGE ?? "",
      gender: p.SEX ?? ""
    };

    Object.entries(map).forEach(([name, value]) => {
      document
        .querySelectorAll(`[name="${name}"]`)
        .forEach(el => {
          el.value = value;
        });
    });
  }
};

/* =========================================================
   SPECIALIZED FILL : NURSING COUNSELOR
========================================================= */
PatientCore.fillToNursingCounselor = function (p) {
  if (!p) return;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) {
      el.value = val;
    }
  };

  set("patient_name", `${p.NAME ?? ""} ${p.LNAME ?? ""}`.trim());
  set("nc_patient_id", p.CID || p.HN || "");

  if (p.SEX === "1" || p.SEX === 1) set("nc_gender", "ชาย");
  else if (p.SEX === "2" || p.SEX === 2) set("nc_gender", "หญิง");

  if (p.BIRTH) {
    const birth = new Date(p.BIRTH);
    if (!isNaN(birth)) {
      const age = new Date().getFullYear() - birth.getFullYear();
      set("nc_age", age);
    }
  }

  set("nc_visit_date", new Date().toISOString().slice(0, 10));
};
