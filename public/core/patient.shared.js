/*************************************************
 * SHARED MODULE : Patient Search + Auto Fill
 * USED BY      : nursingRecords, nursingCounselor
 * STANDARD     : Legal Medical Record
 *************************************************/

console.log("👤 patient.shared.js loaded");

// ==============================
// AGE CALC
// ==============================
function calcAge(birth) {
  if (!birth) return "";
  const dob = new Date(birth);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// ==============================
// SEARCH
// ==============================
async function searchPatientCore(query, renderCallback) {
  if (!query) return;

  try {
    const res = await api.get(`/api/patients/search?q=${query}`);
    console.log("🔥 RAW API RES:", res.data);
    renderCallback(res.data.data || []);
  } catch (err) {
    console.error("❌ patient search error", err);
  }
}


// ==============================
// RENDER RESULT
// ==============================
function renderPatientResults(container, patients, onSelect) {
  console.log("🔥 RENDER:", container, patients.length);

  container.innerHTML = "";

  if (!patients.length) {
    console.log("❌ NO PATIENTS TO RENDER");
    container.style.display = "none";
    return;
  }


  patients.forEach(p => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "list-group-item list-group-item-action";
    item.innerHTML = `
      <strong>${p.NAME} ${p.LNAME}</strong>
      <div class="small text-muted">
        HN: ${p.HN || "-"} | CID: ${p.CID}
      </div>
    `;

    item.onclick = () => onSelect(p);
    container.appendChild(item);
  });

  container.style.display = "block";
}




// ==============================
// FILL FORM
// ==============================
function fillPatientToForms(patient) {
  const map = {
    patient_name: `${patient.NAME} ${patient.LNAME}`,
    age: calcAge(patient.BIRTH),
    gender: patient.SEX === "1" ? "ชาย" : "หญิง",
    patient_id: patient.HN || patient.CID,
    visit_date: new Date().toISOString().slice(0,10)
  };

  document.querySelectorAll("form").forEach(form => {
    Object.entries(map).forEach(([name, value]) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) el.value = value;
    });
  });
}

// 🌐 export to global
window.PatientCore = {
  searchPatientCore,
  renderPatientResults,
  fillPatientToForms
};
