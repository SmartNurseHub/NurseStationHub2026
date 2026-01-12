// =========================
// Smart Nurse Hub - SPA Controller
// =========================

// Global state
let currentView = 'dashboard';

// =========================
// Sidebar
// =========================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
}

// =========================
// Navigation
// =========================
function navTo(view) {
  currentView = view;
  renderView(view);
}

// =========================
// Logout
// =========================
function logout() {
  if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
    // ตัวอย่าง: redirect ไปหน้า login
    window.location.href = '/login.html';
  }
}

// =========================
// View Renderer
// =========================
function renderView(view) {
  const container = document.getElementById('view-container');

  switch (view) {
    case 'dashboard':
      container.innerHTML = dashboardView();
      renderDashboardCharts();
      break;

    case 'patients':
      container.innerHTML = patientsView();
      initPatientsTable();
      break;

    case 'nursingRecords':
      container.innerHTML = nursingRecordsView();
      break;

    case 'appointments':
      container.innerHTML = appointmentsView();
      break;

    case 'reports':
      container.innerHTML = reportsView();
      break;

    case 'settings':
      container.innerHTML = settingsView();
      break;

    default:
      container.innerHTML = '<h4>ไม่พบหน้า</h4>';
  }
}

// =========================
// Views (HTML Templates)
// =========================
function dashboardView() {
  return `
    <h3 class="mb-4">Dashboard</h3>
    <div class="row">
      <div class="col-md-6">
        <canvas id="patientChart"></canvas>
      </div>
      <div class="col-md-6">
        <canvas id="appointmentChart"></canvas>
      </div>
    </div>
  `;
}

function patientsView() {
  return `
    <h3 class="mb-3">รายชื่อผู้รับบริการ</h3>
    <table id="patientsTable" class="display" style="width:100%">
      <thead>
        <tr>
          <th>HN</th>
          <th>ชื่อ-สกุล</th>
          <th>อายุ</th>
          <th>เพศ</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>001</td><td>สมชาย ใจดี</td><td>45</td><td>ชาย</td></tr>
        <tr><td>002</td><td>สมหญิง รักสุข</td><td>38</td><td>หญิง</td></tr>
      </tbody>
    </table>
  `;
}

function nursingRecordsView() {
  return `
    <h3>บันทึกทางการพยาบาล</h3>
    <p>ฟังก์ชันบันทึกข้อมูลทางการพยาบาล (ตัวอย่าง)</p>
    <textarea class="form-control" rows="5" placeholder="บันทึก..."></textarea>
    <button class="btn btn-primary mt-2">บันทึก</button>
  `;
}

function appointmentsView() {
  return `
    <h3>ตารางนัดหมาย</h3>
    <ul class="list-group">
      <li class="list-group-item">10/01/2567 - ผู้ป่วย HN001</li>
      <li class="list-group-item">12/01/2567 - ผู้ป่วย HN002</li>
    </ul>
  `;
}

function reportsView() {
  return `
    <h3>รายงาน</h3>
    <button class="btn btn-success">ออกรายงาน PDF</button>
  `;
}

function settingsView() {
  return `
    <h3>ตั้งค่า</h3>
    <div class="mb-3">
      <label class="form-label">ชื่อผู้ใช้</label>
      <input type="text" class="form-control" value="ธนชนัญ เกณฑ์คง">
    </div>
    <button class="btn btn-primary">บันทึกการตั้งค่า</button>
  `;
}

// =========================
// Init Components
// =========================
function initPatientsTable() {
  $('#patientsTable').DataTable();
}

function renderDashboardCharts() {
  const ctx1 = document.getElementById('patientChart');
  const ctx2 = document.getElementById('appointmentChart');

  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ['ผู้ป่วยใหม่', 'ผู้ป่วยเก่า'],
      datasets: [{
        data: [12, 30]
      }]
    }
  });

  new Chart(ctx2, {
    type: 'pie',
    data: {
      labels: ['มาตามนัด', 'เลื่อนนัด'],
      datasets: [{
        data: [20, 5]
      }]
    }
  });
}

// =========================
// App Init
// =========================
document.addEventListener('DOMContentLoaded', () => {
  renderView(currentView);
});
