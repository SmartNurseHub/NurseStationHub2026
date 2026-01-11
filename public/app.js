// Sidebar
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

// Navigation
function navTo(page) {
  const container = document.getElementById("view-container");

  switch (page) {
    case "dashboard":
      loadDashboard();
      break;

    case "patients":
      loadPatients();
      break;

    default:
      container.innerHTML = "<h4>กำลังพัฒนา...</h4>";
  }
}

// Dashboard
async function loadDashboard() {
  const res = await fetch("/api/sheets/dashboard");
  const data = await res.json();

  document.getElementById("view-container").innerHTML = `
    <h3>Dashboard</h3>
    <ul>
      <li>ผู้ป่วยทั้งหมด: ${data.patients}</li>
      <li>นัดหมายวันนี้: ${data.appointments}</li>
      <li>พยาบาล: ${data.nurses}</li>
    </ul>
  `;
}

// Patients
async function loadPatients() {
  const res = await fetch("/api/sheets/patients");
  const patients = await res.json();

  let rows = patients.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.age}</td>
    </tr>
  `).join("");

  document.getElementById("view-container").innerHTML = `
    <h3>รายชื่อผู้รับบริการ</h3>
    <table id="patientsTable" class="display">
      <thead>
        <tr><th>ID</th><th>ชื่อ</th><th>อายุ</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  $("#patientsTable").DataTable();
}


// Logout
function logout() {
  alert("ออกจากระบบแล้ว");
}

// Default page
document.addEventListener("DOMContentLoaded", () => {
  navTo("dashboard");
});
