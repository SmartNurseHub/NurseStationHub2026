// =======================================================
// Smart Nurse Hub - SPA Controller (FULL VERSION)
// =======================================================

// =========================
// Global state
// =========================
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
    window.location.href = '/login.html';
  }
}

// =========================
// View Renderer
// =========================
async function renderView(view) {
  const container = document.getElementById('view-container');

  switch (view) {

    case 'dashboard':
      container.innerHTML = dashboardView();
      renderDashboardCharts();
      break;

    case 'patients':
      await loadExternalView('patients');
      initPatientUpload();
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
// Load External HTML View
// =========================
async function loadExternalView(viewName) {
  const container = document.getElementById('view-container');

  try {
    const res = await fetch(`/views/${viewName}.html`);
    if (!res.ok) throw new Error('ไม่สามารถโหลดหน้าได้');

    container.innerHTML = await res.text();

  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger text-center">
        ${err.message}
      </div>
    `;
  }
}

// =========================
// Inline Views
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

function nursingRecordsView() {
  return `
    <h3>บันทึกทางการพยาบาล</h3>
    <textarea class="form-control mb-2" rows="5" placeholder="บันทึก..."></textarea>
    <button class="btn btn-primary">บันทึก</button>
  `;
}

function appointmentsView() {
  return `
    <h3>ตารางนัดหมาย</h3>
    <ul class="list-group">
      <li class="list-group-item">10/01/2567 - HN001</li>
      <li class="list-group-item">12/01/2567 - HN002</li>
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
    <button class="btn btn-primary">บันทึก</button>
  `;
}

// =========================
// Dashboard Charts
// =========================
function renderDashboardCharts() {
  const ctx1 = document.getElementById('patientChart');
  const ctx2 = document.getElementById('appointmentChart');

  if (!ctx1 || !ctx2) return;

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
// Patients Upload Logic
// =========================
function initPatientUpload() {
  const fileInput = document.getElementById('fileInput');
  const fileName = document.getElementById('fileName');
  const submitBtn = document.getElementById('submitFile');
  const progressBar = document.getElementById('uploadProgress');

  if (!fileInput || !submitBtn) return;

  fileInput.addEventListener('change', () => {
    fileName.textContent = fileInput.files[0]?.name || 'ยังไม่ได้เลือกไฟล์';
  });

  submitBtn.addEventListener('click', async () => {
    if (!fileInput.files.length) {
      alert('กรุณาเลือกไฟล์');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    progressBar.style.width = '30%';
    progressBar.textContent = 'กำลังอัปโหลด...';

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      document.getElementById('totalRows').textContent = data.totalRows || 0;
      document.getElementById('newRows').textContent = data.newRows || 0;
      document.getElementById('updatedRows').textContent = data.updatedRows || 0;
      document.getElementById('uploadStatus').textContent = 'อัปโหลดสำเร็จ';

      progressBar.style.width = '100%';
      progressBar.textContent = '100%';

    } catch (err) {
      document.getElementById('uploadStatus').textContent = 'เกิดข้อผิดพลาด';
      progressBar.classList.add('bg-danger');
    }
  });
}

// =========================
// App Init
// =========================
document.addEventListener('DOMContentLoaded', () => {
  renderView(currentView);
});
