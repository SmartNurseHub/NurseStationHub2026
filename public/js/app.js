const API_BASE = "/api/sheet";
const $id = id => document.getElementById(id);

let patientsData = [];
let patientIndex = [];
let nursingRecordsCache = [];
let editingNSR = null;

/* ======================= SPA NAV ======================= */
function navTo(view) {
  fetch(`${view}.html`)
    .then(r => r.text())
    .then(html => {
      $id("view-container").innerHTML = html;

      if(view === "patients"){
        loadPatients().then(() => setTimeout(initPatientUploadSSE,0));
        setupPatientSearch();
      }

      if(view === "nursingRecords"){
        initNursingPage();
      }
    });
}

/* ======================= PATIENT ======================= */
async function loadPatients(){
  try{
    const res = await fetch(`${API_BASE}/patients`);
    const json = await res.json();
    patientsData = json.data || [];
    patientIndex = patientsData.map((p,i)=>({i, text:`${p.HN} ${p.NAME} ${p.LNAME}`.toLowerCase()}));
  }catch(err){
    console.error("loadPatients:",err);
    patientsData = []; patientIndex=[];
  }
}

function setupPatientSearch() {
  const input = $id("patientSearch");
  const list = $id("searchResults");
  const btn = $id("btnSearchPatient");
  if (!input || !list || !btn) return;

  const doSearch = () => {
    list.innerHTML = "";               // ล้างผลเก่า
    const q = input.value.toLowerCase().trim();
    if (!q) {
      list.style.display = "none";     // ซ่อน dropdown ถ้าไม่มีค่า
      return;
    }

    const results = patientIndex
      .filter(x => x.text.includes(q))
      .slice(0, 10);                    // แสดงสูงสุด 10 รายการ

    results.forEach(x => {
      const p = patientsData[x.i];
      const a = document.createElement("a");
      a.href = "#";
      a.className = "list-group-item list-group-item-action";
      a.textContent = `${p.NAME} ${p.LNAME} (${p.HN})`;

      a.onclick = (e) => {
        e.preventDefault();

        // เติมฟอร์ม
        ["HN", "CID", "NAME", "LNAME", "TELEPHONE"].forEach(k => {
          if ($id(k)) $id(k).value = p[k] || "";
        });

        // highlight active
        list.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
        a.classList.add('active');

        list.style.display = "none";   // ปิด dropdown
      };

      list.appendChild(a);
    });

    list.style.display = results.length ? "block" : "none";
  };

  // ค้นหาเมื่อพิมพ์
  input.oninput = doSearch;

  // ค้นหาเมื่อกดปุ่ม
  btn.onclick = doSearch;

  // ปิด dropdown ถ้าคลิกนอก
  document.addEventListener("click", e => {
    if (!list.contains(e.target) && e.target !== input && e.target !== btn) {
      list.style.display = "none";
    }
  });
}



/* ======================= NURSING ======================= */
async function loadNursingRecords(){
  try{
    const res = await fetch(`${API_BASE}/nursing-records`);
    const json = await res.json();
    nursingRecordsCache = json.data || [];
    renderNursingTable();
  }catch(err){
    console.error("loadNursingRecords:",err);
    nursingRecordsCache=[];
  }
}

function renderNursingTable(){
  const tbody = $id("nursingTableBody");
  if(!tbody) return;
  tbody.innerHTML = "";
  nursingRecordsCache.forEach(r=>{
    tbody.innerHTML+=`
      <tr>
        <td>${r.NSR}</td>
        <td>${r.DateService}</td>
        <td>${r.HN}</td>
        <td>${r.NAME} ${r.LNAME}</td>
        <td>${r.Activity}</td>
        <td>${r.Provider1}</td>
        <td>
          <button class="edit-record" data-nsr="${r.NSR}">✏️</button>
        </td>
      </tr>`;
  });
}

/* ======================= EDIT RECORD ======================= */
function bindEditButtons(){
  document.addEventListener("click", e=>{
    const btn = e.target.closest(".edit-record");
    if(!btn) return;

    editingNSR = btn.dataset.nsr;
    const rec = nursingRecordsCache.find(r=>r.NSR===editingNSR);
    if(!rec) return;

    Object.entries(rec).forEach(([k,v])=>{
      if($id(k)) $id(k).value = v || "";
    });

    // เปิด tab online
    const openTabBtn = document.querySelector('.open-tab[data-target-tab="online"]');
    if(openTabBtn) openTabBtn.click();
  });
}

/* ======================= NURSING FORM ======================= */
function setupNursingForm(){
  const form = $id("nursingForm");
  if(!form) return;

  form.onsubmit = async e=>{
    e.preventDefault();
    if(!editingNSR){ alert("กรุณาเลือกหรือเพิ่มข้อมูลก่อน"); return; }
    const data = Object.fromEntries(new FormData(form).entries());
    try{
      const res = await fetch(`${API_BASE}/nursing-records/${editingNSR}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if(json.success){
        alert("บันทึกข้อมูลเรียบร้อยแล้ว");
        editingNSR=null;
        form.reset();
        loadNursingRecords();
      }else alert("บันทึกไม่สำเร็จ");
    }catch(err){
      console.error("saveNursingRecord:",err);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };
}

/* ======================= TAB CONTROLLER ======================= */
document.addEventListener("click", e=>{
  const btn = e.target.closest('.open-tab');
  if(!btn) return;

  e.preventDefault();
  const targetTab = btn.dataset.targetTab;
  if(!targetTab) return;

  document.querySelectorAll('.nr-tab-panel').forEach(p=>{
    p.style.display='none';
    p.classList.remove('active');
  });

  const panel = document.querySelector(`.nr-tab-panel[data-tab="${targetTab}"]`);
  if(panel){
    panel.style.display='block';
    panel.classList.add('active');
  }

  // ปิด dropdown
  const dropdown = btn.closest('.dropdown');
  if(dropdown){
    const menu = dropdown.querySelector('.dropdown-menu');
    if(menu) menu.classList.remove('show');
  }
});

/* ======================= INIT NURSING PAGE ======================= */
function initNursingPage(){
  loadPatients().then(setupPatientSearch);
  loadNursingRecords();
  setupNursingForm();
  bindEditButtons();

  // ซ่อน tab ทุกอันตอนโหลด
  document.querySelectorAll('.nr-tab-panel').forEach(p=>p.style.display='none');
}

/* ======================= START ======================= */
navTo("dashboard");
