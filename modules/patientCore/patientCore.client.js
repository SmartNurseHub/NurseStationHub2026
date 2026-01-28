/************************************************************
 * MODULE : PatientCore
 * PURPOSE: Shared patient search for all nursing forms
 ************************************************************/

console.log("🧠 PatientCore LOADED");

window.PatientCore = {

  async searchPatientCore(keyword, callback) {
  if (!keyword || keyword.length < 2) {
    callback([]);
    return;
  }

  try {
    const res = await fetch(
      "/api/patients/search?q=" + encodeURIComponent(keyword)
    );
    const json = await res.json();

    // ✅ จุดสำคัญ
    callback(Array.isArray(json.data) ? json.data : []);

  } catch (err) {
    console.error("Patient search failed", err);
    callback([]);
  }
},


  renderPatientResults(container, data, onSelect) {
    if (!container) return;

    container.innerHTML = "";
    container.style.display = "block";

    if (!data.length) {
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

  fillPatientToForms(p) {
    const map = {
      patient_name: `${p.NAME} ${p.LNAME}`,
      patient_id: p.HN || p.CID,
      age: p.AGE,
      gender: p.SEX
    };

    Object.entries(map).forEach(([name, value]) => {
      document
        .querySelectorAll(`[name="${name}"]`)
        .forEach(el => el.value = value ?? "");
    });
  }
};

PatientCore.fillToNursingCounselor = function (p) {

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) {
      el.value = val;
    }
  };

  set("patient_name", `${p.NAME} ${p.LNAME}`);
  set("nc_patient_id", p.CID || p.HN);

  // เพศ
  if (p.SEX === "1" || p.SEX === 1) set("nc_gender", "ชาย");
  else if (p.SEX === "2" || p.SEX === 2) set("nc_gender", "หญิง");

  // อายุจากวันเกิด
  if (p.BIRTH) {
    const birth = new Date(p.BIRTH);
    const age = new Date().getFullYear() - birth.getFullYear();
    set("nc_age", age);
  }

  // วันที่รับคำปรึกษา = วันนี้
  set("nc_visit_date", new Date().toISOString().slice(0, 10));
};
