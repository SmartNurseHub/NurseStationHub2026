/************************************************************
 * vaccination.client.js
 * CLIENT SIDE (FULL STABLE FIXED)
 ************************************************************/

console.log("💉 vaccination.client.js loaded");

/* =========================================================
   INIT
========================================================= */
window.initVaccination = async function () {

  console.log("🚀 Init Vaccination Module");

  try {

    setupTabs();
    setupForm();
    setupPatientSearch();

    await loadVaccineMaster();

  } catch (err) {
    console.error("❌ initVaccination error:", err);
  }

};

/* =========================================================
   PRENAME
========================================================= */
function getPrename(code) {

  const map = {
    1: "ด.ช.",
    2: "ด.ญ.",
    3: "นาย",
    4: "นาง",
    5: "น.ส."
  };

  return map[code] || "";

}

/* =========================================================
   AGE
========================================================= */
function calculateAge(birthDate){

  if(!birthDate || birthDate === "-") return "-";

  const birth = new Date(birthDate);

  if(isNaN(birth)) return "-";

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;

}

/* =========================================================
   SET PATIENT
========================================================= */
function setPatientInfo(p){

  if(!p) return;

  const birth =
    p.BIRTH ||
    p.Birth ||
    p.birth ||
    p.BIRTHDATE ||
    p.birthDate ||
    "";

  const phone =
    p.MOBILE ||
    p.mobile ||
    p.phone ||
    p.telephone ||
    "";

  const age = calculateAge(birth);

  const birthEl = document.getElementById("vaccineBirthDate");
  const ageEl = document.getElementById("vaccineAge");
  const phoneEl = document.getElementById("vaccinePhone");

  if(birthEl) birthEl.textContent = birth || "-";
  if(ageEl) ageEl.textContent = age || "-";
  if(phoneEl) phoneEl.textContent = phone || "-";

}

/* =========================================================
   TAB
========================================================= */
function setupTabs() {

  document.querySelectorAll(".open-tab").forEach(btn => {

    btn.addEventListener("click", () => {

      const tab = btn.dataset.tab;
      showTab(tab);

    });

  });

}

function showTab(tab) {

  document.querySelectorAll(".vaccine-tab").forEach(el => {
    el.classList.add("d-none");
  });

  const target = document.getElementById(tab + "Tab");

  if (target) target.classList.remove("d-none");

}

/* =========================================================
   LOAD MASTER
========================================================= */
async function loadVaccineMaster() {

  try {

    const res = await fetch("/api/vaccination/master");
    const result = await res.json();

    if (!result.success) return;

    const vaccines = result.data;
    const select = document.getElementById("vaccineType");

    if (!select) return;

    select.innerHTML = `<option value="">-- เลือกวัคซีน --</option>`;

    vaccines.forEach(v => {

      const opt = document.createElement("option");

      opt.value = v.code;
      opt.textContent = `${v.name} (${v.code})`;

      select.appendChild(opt);

    });

  } catch (err) {

    console.error("❌ loadVaccineMaster error:", err);

  }

}

/* =========================================================
   FORM SUBMIT
========================================================= */
function setupForm() {

  const form = document.getElementById("vaccinationForm");
  if (!form) return;

  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async e => {

    e.preventDefault();

    if(submitBtn) submitBtn.disabled = true;

    const payload = {

      cid: document.getElementById("vaccineCIDInput").value.trim(),

      vaccineCode:
        document.getElementById("vaccineType").value,

      doseNo: Number(
        document.getElementById("doseNumber").value
      ),

      dateService:
        document.getElementById("recordDate").value,

      lotNumber:
        document.getElementById("lotNumber").value.trim(),

      providerRole:
        document.getElementById("providerRole").value,

      providerName:
        document.getElementById("providerName").value.trim(),

      locationDetail:
        document.getElementById("locationDetail").value.trim(),

      locationType:
        document.getElementById("serviceLocation").value

    };

    /* VALIDATION */

    if(!payload.cid){
      alert("กรุณาเลือกผู้ป่วย");
      submitBtn.disabled=false;
      return;
    }

    if(!payload.vaccineCode){
      alert("กรุณาเลือกวัคซีน");
      submitBtn.disabled=false;
      return;
    }

    if(!payload.doseNo){
      alert("กรุณาระบุเข็มที่");
      submitBtn.disabled=false;
      return;
    }

    if(!payload.dateService){
      alert("กรุณาระบุวันที่ให้บริการ");
      submitBtn.disabled=false;
      return;
    }

    try {

      const res = await fetch("/api/vaccination/add", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)

      });

      const result = await res.json();

      if (!result.success) {

        alert(result.error || "❌ บันทึกไม่สำเร็จ");
        submitBtn.disabled=false;
        return;

      }

      alert("✅ บันทึกสำเร็จ");

      form.reset();

      if (payload.cid) {

        loadTimeline(payload.cid);
        loadLatestVaccines(payload.cid);
        loadVaccinationTable(payload.cid);

      }

    } catch (err) {

      console.error("❌ save vaccination error", err);
      alert("Server Error");

    }

    if(submitBtn) submitBtn.disabled=false;

  });

}

/* =========================================================
   PATIENT SEARCH
========================================================= */
function setupPatientSearch() {

  const btn = document.getElementById("searchPatientBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {

    try {

      const res = await fetch("/api/patients/list");
      const result = await res.json();

      if (!result.success) return;

      const table = document.getElementById("patientSearchTable");
      if(!table) return;

      table.innerHTML = "";

      result.data.forEach(p => {

        const tr = document.createElement("tr");

        const name =
          `${getPrename(p.PRENAME)} ${p.NAME} ${p.LNAME}`;

        tr.innerHTML = `
          <td>${p.CID}</td>
          <td>${name}</td>
          <td>
            <button class="btn btn-sm btn-success selectPatient">
              เลือก
            </button>
          </td>
        `;

        tr.querySelector(".selectPatient").onclick = () => {
          selectPatient(p);
        };

        table.appendChild(tr);

      });

      const modalEl = document.getElementById("patientSearchModal");
      if(!modalEl) return;

      const modal = new bootstrap.Modal(modalEl);
      modal.show();

    } catch (err) {

      console.error("❌ search patient error", err);

    }

  });

}

/* =========================================================
   SELECT PATIENT
========================================================= */
function selectPatient(p) {

  const name =
    `${getPrename(p.PRENAME)} ${p.NAME} ${p.LNAME}`;

  document.getElementById("vaccinePatientName").textContent =
    `👤 ${name}`;

  document.getElementById("vaccineCID").textContent = p.CID;
  document.getElementById("vaccineCIDInput").value = p.CID;

  setPatientInfo(p);

  const modalEl = document.getElementById("patientSearchModal");

  if(modalEl){

    const modal = bootstrap.Modal.getInstance(modalEl);
    if(modal) modal.hide();

  }

  loadTimeline(p.CID);
  loadLatestVaccines(p.CID);
  loadVaccinationTable(p.CID);

}

/* =========================================================
   LOAD TIMELINE
========================================================= */
async function loadTimeline(patientId) {

  try {

    const res = await fetch(`/api/vaccination/timeline/${patientId}`);
    const result = await res.json();

    if(!result.success) return;

    const data = result.data;

    const timeline = document.getElementById("vaccineTimeline");
    if (!timeline) return;

    timeline.innerHTML = "";

    if (!data.length) {

      timeline.innerHTML = `
        <div class="text-muted">
          ยังไม่มีประวัติวัคซีน
        </div>
      `;

      return;
    }

    data.forEach(v => {

      const row = document.createElement("div");

      row.className = "card mb-2";

      row.innerHTML = `
        <div class="card-body">
          <b>${v.vaccine_name}</b><br>
          Dose: ${v.dose_number}<br>
          Date: ${v.vaccination_date}
        </div>
      `;

      timeline.appendChild(row);

    });

  } catch (err) {

    console.error("❌ loadTimeline error:", err);

  }

}

/* =========================================================
   LOAD LATEST VACCINES
========================================================= */
async function loadLatestVaccines(cid){

  try{

    const res = await fetch(`/api/vaccination/latest/${cid}`);
    const result = await res.json();

    if(!result.success) return;

    const container = document.getElementById("latestVaccines");

    if(!container) return;

    container.innerHTML = "";

    if(!result.data.length){

      container.innerHTML = `
        <div class="text-muted">
          ยังไม่มีข้อมูลวัคซีนล่าสุด
        </div>
      `;

      return;
    }

    result.data.forEach(v => {

      const div = document.createElement("div");

      div.className = "badge bg-info me-2 mb-2";

      div.textContent = `${v.vaccine_name} (เข็ม ${v.dose_number})`;

      container.appendChild(div);

    });

  }catch(err){

    console.error("❌ loadLatestVaccines error",err);

  }

}

/* =========================================================
   LOAD VACCINATION TABLE
========================================================= */
async function loadVaccinationTable(cid){

  try{

    const res = await fetch(`/api/vaccination/history/${cid}`);
    const result = await res.json();

    if(!result.success) return;

    const table = document.getElementById("vaccinationHistoryTable");

    if(!table) return;

    table.innerHTML = "";

    result.data.forEach(v => {

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${v.vaccination_date}</td>
        <td>${v.vaccine_name}</td>
        <td>${v.dose_number}</td>
        <td>${v.lot_number || "-"}</td>
        <td>${v.provider_name || "-"}</td>
      `;

      table.appendChild(tr);

    });

  }catch(err){

    console.error("❌ loadVaccinationTable error",err);

  }

}