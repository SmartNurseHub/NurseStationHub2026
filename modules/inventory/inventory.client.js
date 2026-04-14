/*************************************************
 * INVENTORY CLIENT (MASTER FIXED VERSION)
 *************************************************/

/* ===============================
   STATE
================================ */
let STOCK_MASTER = [];
let MODE = "edit";
let LOT_DATA = [];
let LOTS = [];
let MASTER_LIST = [];
let LOT_MODE = "add";
/* ===============================
   SAFE DOM
================================ */
function el(id){
  return document.getElementById(id);
}

/* ===============================
   OPEN STOCK UI
================================ */
function hideDashboard(){
  const dash = document.getElementById("dashboard-card");
  if (dash) dash.classList.add("d-none");
}

function showDashboard(){
  const dash = document.getElementById("dashboard-card");
  if (dash) dash.classList.remove("d-none");
  document.getElementById("content-area").innerHTML = "";
}

function openMaster(){

  hideDashboard();

  const el = document.getElementById("content-area");

  el.innerHTML = `
    <div class="card shadow-sm border-0" style="border-radius:16px;">
      <div class="card-body">

        <div class="d-flex justify-content-between mb-2">
          <h6 class="fw-bold">📦 Inventory Master</h6>

          <div>
            <button class="btn btn-sm btn-success" onclick="setAddMode()">➕ เพิ่มรายการ</button>
            <button class="btn btn-sm btn-warning" onclick="setEditMode()">✏️ แก้ไขรายการ</button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-sm table-bordered text-center align-middle">
            <thead class="table-light">
              <tr style="font-size:10px;">
                <th width="10">รหัส</th>
                <th width="50">รายการ</th>
                <th width="10">ขนาด</th>
                <th width="10">Min Qty</th>
                <th width="10">หน่วย</th>
                <th width="10">ลบ</th>
              </tr>
            </thead>
            <tbody id="stock-body"></tbody>
          </table>
        </div>

        <div class="text-end mt-2">
          <button class="btn btn-primary" onclick="saveStock()">💾 บันทึก</button>
        </div>

      </div>
    </div>
  `;

  loadMaster();
}

function openStock(){

  hideDashboard();

  const el = document.getElementById("content-area");

  el.innerHTML = `
    <div class="card shadow-sm border-0">
      <div class="card-body">

        <div class="d-flex justify-content-between mb-2">
          <h6>📦 Inventory Lot</h6>

          <button class="btn btn-sm btn-success" onclick="openLotModal()">
            ➕ เพิ่ม Lot
          </button>
        </div>

        <div class="table-responsive">
          <table class="table table-sm table-bordered text-center align-middle">
            <thead class="table-light">
              <tr style="font-size:11px;">
                <th>Lotid</th>
                <th>Item</th>
                <th>Lot</th>
                <th>Exp</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Provider</th>
                <th>ลบ</th>
              </tr>
            </thead>
            <tbody id="lot-body"></tbody>
          </table>
        </div>

        <div class="text-end mt-2">
          <button class="btn btn-primary" onclick="saveLot()">💾 Save</button>
        </div>

      </div>
    </div>

    ${renderLotModal()}
  `;

  loadMasterForLot();
  loadLots();
}

function openLot(){

  hideDashboard();

  const el = document.getElementById("content-area");

  el.innerHTML = `
    <div class="card shadow-sm border-0">
      <div class="card-body">

        <div class="d-flex justify-content-between mb-2">
          <h6>📦 Inventory Lot</h6>
          <button class="btn btn-success btn-sm" onclick="openLotModal()">
            ➕ เพิ่ม Lot
          </button>
        </div>

        <div id="lot-table"></div>

      </div>
    </div>


    <!-- MODAL -->
    <div class="modal fade" id="lotModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">

          <div class="modal-header">
            <h6>📦 เพิ่ม Lot</h6>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">

            <select id="itemSelect" class="form-control mb-2"
              onchange="fillItemData()"></select>

            <input id="lot" class="form-control mb-2" placeholder="Lot">

            <input id="exp" type="date" class="form-control mb-2">

            <input id="qty" type="number" class="form-control mb-2" placeholder="Qty">

            <input id="providers" class="form-control mb-2" placeholder="Providers">

            <input id="status" class="form-control mb-2" value="active" readonly>

          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" onclick="saveLot()">
              💾 บันทึก
            </button>
          </div>

        </div>
      </div>
    </div>
  `;

  loadMasterForLot();
  loadLots();
}

function openLotModal(){

  document.getElementById("lot").value = generateLotId();
  document.getElementById("qty").value = "";
  document.getElementById("exp").value = "";
  document.getElementById("providers").value = "";
  document.getElementById("status").value = "active";

  new bootstrap.Modal(document.getElementById("lotModal")).show();
}
/* ===============================
   LOAD MASTER FROM SERVER
================================ */
async function loadMaster(){
  try{
    const res = await fetch("/api/inventory/master");
    const data = await res.json();

    STOCK_MASTER = data || [];
    renderStock();

  }catch(err){
    console.error("loadMaster error", err);
  }
}

async function loadLot(){
  const res = await fetch("/api/inventory/lot");
  const data = await res.json();

  LOT_DATA = data || [];
  renderLot();
}

async function loadMasterForLot(){

  const res = await fetch("/api/inventory/master");
  MASTER_LIST = await res.json();

  const sel = document.getElementById("itemSelect");

  sel.innerHTML = MASTER_LIST.map(m => `
    <option value="${m.id}">
      ${m.id} | ${m.name} | ${m.size} | ${m.unit}
    </option>
  `).join("");

}

async function loadLots(){
  const res = await fetch("/api/inventory/lot");
  LOTS = await res.json();

  const el = document.getElementById("lot-table");

  el.innerHTML = `
    <table class="table table-sm table-bordered">
      <thead>
        <tr>
          <th>LotID</th>
          <th>Item</th>
          <th>Lot</th>
          <th>Exp</th>
          <th>Qty</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${LOTS.map(l=>`
          <tr>
            <td>${l.lotid}</td>
            <td>${l.item_id}</td>
            <td>${l.lot}</td>
            <td>${l.exp}</td>
            <td>${l.qty}</td>
            <td>${l.status}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/* ===============================
   MODE
================================ */
function setAddMode(){
  MODE = "add";
  STOCK_MASTER = [];
  addRow();
  renderStock();
}

function setEditMode(){
  MODE = "edit";
  loadMaster();
}

function fillItemData(){
  const id = document.getElementById("itemSelect").value;
  const item = MASTER_LIST.find(x => x.id === id);

  if(!item) return;

  document.getElementById("status").value = "active";
}

function generateLotId(){

  const now = new Date();
  const yyyymm =
    now.getFullYear().toString() +
    String(now.getMonth()+1).padStart(2,"0");

  const prefix = "LID" + yyyymm;

  const last = LOTS
    .filter(l => l.lotid?.startsWith(prefix))
    .length;

  const running = String(last + 1).padStart(4,"0");

  return prefix + running;
}
/* ===============================
   RENDER TABLE
================================ */
function renderStock(){

  const body = document.getElementById("stock-body");
  if(!body) return;

  body.innerHTML = "";

  STOCK_MASTER.forEach((item, i)=>{

    body.innerHTML += `
<tr>

  <!-- ID (LOCKED) -->
  <td>
    <input class="form-control form-control-sm text-center"
      value="${item.id || ""}"
      readonly
      style="background:#f5f5f5; font-size: 11px;">
  </td>

  <!-- NAME -->
  <td>
    <input class="form-control form-control-sm"
      value="${item.name || ""}"
      onchange="updateStock(${i},'name',this.value)"
      style="background:#f5f5f5; font-size: 11px;">
  </td>

  <!-- SIZE -->
  <td>
    <input class="form-control form-control-sm"
      value="${item.size || ""}"
      onchange="updateStock(${i},'size',this.value)"
      style="background:#f5f5f5; font-size: 11px;">
  </td>

  <!-- MIN QTY -->
  <td>
    <input type="number" class="form-control form-control-sm text-center"
      value="${item.min_qty || 0}"
      onchange="updateStock(${i},'min_qty',this.value)"
      style="background:#f5f5f5; font-size: 11px;">
  </td>

  <!-- UNIT -->
  <td>
    <input class="form-control form-control-sm text-center"
      value="${item.unit || ""}"
      onchange="updateStock(${i},'unit',this.value)"
      style="background:#f5f5f5; font-size: 11px;">
  </td>

  <!-- DELETE -->
  <td class="text-center">
    <button class="btn btn-sm btn-danger"
      onclick="deleteRow(${i})">✖</button>
  </td>

</tr>
`;
  });
}


function renderLot(){

  const body = document.getElementById("lot-body");
  if(!body) return;

  body.innerHTML = "";

  LOT_DATA.forEach((item,i)=>{

    body.innerHTML += `
<tr>

  <td>
    <input class="form-control form-control-sm"
      value="${item.Lotid || ""}"
      onchange="updateLot(${i},'Lotid',this.value)">
  </td>

  <td>
    <input class="form-control form-control-sm"
      value="${item.Item_id || ""}"
      onchange="updateLot(${i},'Item_id',this.value)">
  </td>

  <td>
    <input class="form-control form-control-sm"
      value="${item.lot || ""}"
      onchange="updateLot(${i},'lot',this.value)">
  </td>

  <td>
    <input type="date" class="form-control form-control-sm"
      value="${item.Exp || ""}"
      onchange="updateLot(${i},'Exp',this.value)">
  </td>

  <td>
    <input type="number" class="form-control form-control-sm"
      value="${item.Qty || 0}"
      onchange="updateLot(${i},'Qty',this.value)">
  </td>

  <td>
    <select class="form-control form-control-sm"
      onchange="updateLot(${i},'Status',this.value)">
      <option ${item.Status==="ACTIVE"?"selected":""}>ACTIVE</option>
      <option ${item.Status==="EXPIRED"?"selected":""}>EXPIRED</option>
    </select>
  </td>

  <td>
    <input class="form-control form-control-sm"
      value="${item.providers || ""}"
      onchange="updateLot(${i},'providers',this.value)">
  </td>

  <td>
    <button class="btn btn-sm btn-danger"
      onclick="deleteLot(${i})">✖</button>
  </td>

</tr>
`;
  });
}

function renderLotModal(){
  return `
    <div class="modal fade" id="lotModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">

          <div class="modal-header">
            <h6>📦 เพิ่ม Lot</h6>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">

            <select id="itemSelect" class="form-control mb-2"></select>

            <input id="lot" class="form-control mb-2" placeholder="Lot">

            <input id="exp" type="date" class="form-control mb-2">

            <input id="qty" type="number" class="form-control mb-2" placeholder="Qty">

            <input id="providers" class="form-control mb-2" placeholder="Providers">

            <input id="status" class="form-control mb-2" value="active" readonly>

          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" onclick="saveLot()">💾 บันทึก</button>
          </div>

        </div>
      </div>
    </div>
  `;
}
/* ===============================
   UPDATE FIELD
================================ */
function updateStock(i,key,val){
  STOCK_MASTER[i][key] = val;
}

function updateLot(i,key,val){
  LOT_DATA[i][key] = val;
}

function addLotRow(){
  LOT_DATA.push({
    Lotid:"",
    Item_id:"",
    lot:"",
    Exp:"",
    Qty:0,
    Status:"ACTIVE",
    QRCode:"",
    providers:""
  });

  renderLot();
}

function deleteLot(i){
  LOT_DATA.splice(i,1);
  renderLot();
}

/* ===============================
   ADD ROW
================================ */
function addRow(){
  STOCK_MASTER.push({
    name:"",
    size:"",
    min_qty:0,
    unit:""
  });
  renderStock();
}

/* ===============================
   DELETE ROW
================================ */
function deleteRow(i){
  STOCK_MASTER.splice(i,1);
  renderStock();
}

/* ===============================
   SAVE MASTER (REPLACE ALL)
================================ */
async function saveStock(){

  try{

    await fetch("/api/inventory/master",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(STOCK_MASTER)
    });

    alert("✅ บันทึก Inventory Master สำเร็จ");
    loadMaster();

  }catch(err){
    console.error(err);
    alert("❌ บันทึกไม่สำเร็จ");
  }
}

async function saveLot(){

  await fetch("/api/inventory/lot",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(LOT_DATA)
  });

  alert("Saved Lot");
  loadLot();
}

async function saveLot(){

  const item_id = document.getElementById("itemSelect").value;
  const lotid = document.getElementById("lot").value;

  const payload = {
    lotid,
    item_id,
    lot: document.getElementById("lot").value,
    exp: document.getElementById("exp").value,
    qty: Number(document.getElementById("qty").value || 0),
    providers: document.getElementById("providers").value,
    status: "active"
  };

  await fetch("/api/inventory/lot",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });

  alert("✅ บันทึก Lot สำเร็จ");

  bootstrap.Modal.getInstance(
    document.getElementById("lotModal")
  ).hide();

  loadLots();
}



function initInventory(){
  console.log("📦 Inventory Ready");
}
window.openMaster = openMaster;
window.addRow = addRow;
window.deleteRow = deleteRow;
window.updateStock = updateStock;
window.saveStock = saveStock;
window.setAddMode = setAddMode;
window.setEditMode = setEditMode;