/*************************************************
 * DASHBOARD CLIENT (STABLE VERSION)
 *************************************************/

/* =========================================
   INIT (รองรับทั้งปกติ + SPA)
========================================= */
async function initDashboard() {
  await loadLineUIDTable();
  await loadPatients();
  await loadFollowers(); // ต้องอยู่หลัง DOM ready
}

document.addEventListener("DOMContentLoaded", initDashboard);
window.initDashboard = initDashboard;

/* ===============================
   FORMAT THAI DATE
================================ */
function formatThaiDateShort(isoDate) {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return date.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/* ===============================
   LOAD FOLLOW TABLE
================================ */
async function loadLineUIDTable() {
  try {
    const res = await fetch("/api/lineuid");
    const json = await res.json();

    const tbody = document.getElementById("followTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!json.success || !Array.isArray(json.data)) {
      tbody.innerHTML =
        "<tr><td colspan='7'>โหลดข้อมูลไม่สำเร็จ</td></tr>";
      return;
    }

    if (json.data.length === 0) {
      tbody.innerHTML =
        "<tr><td colspan='7' class='text-muted'>ไม่พบข้อมูล</td></tr>";
      return;
    }

    json.data.forEach(row => {
      tbody.innerHTML += `
        <tr>
          <td>${row.cid}</td>
          <td>${row.name} ${row.lname}</td>

          <td>
            <img src="${row.picture}"
                onerror="this.src='https://via.placeholder.com/45';"
                style="width:45px;
                        height:45px;
                        object-fit:cover;
                        border-radius:50%;
                        border:2px solid #28a745;">
          </td>

          <td>${row.displayName}</td>
          <td>${row.userId}</td>
          <td>
            <span class="badge bg-success">
              ${row.status || "Active"}
            </span>
          </td>

          <td>
            <button class="btn btn-sm btn-danger delete-btn"
                    data-cid="${row.cid}">
              Delete
            </button>
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("❌ loadLineUIDTable error:", err);
  }
}

/* ===============================
   LOAD FOLLOWERS → LINE DROPDOWN
================================ */
async function loadFollowers() {
  try {
    const res = await fetch("/api/followlist");
    const result = await res.json();

    if (!result.success) return;

    const select = document.getElementById("lineSelect");
    if (!select) return;

    select.innerHTML = '<option value="">-- เลือก LINE UID --</option>';

    result.data.forEach(item => {
      const option = document.createElement("option");

      option.value = item.userId;
      option.textContent = `${item.displayName} (${item.userId})`;

      // ✅ ใส่ dataset ให้ครบ
      option.dataset.displayname = item.displayName;
      option.dataset.userid = item.userId;
      option.dataset.status = item.eventType || "follow";
      option.dataset.picture = item.picture || "";
      option.dataset.pictureurl = item.pictureUrl || "";

      select.appendChild(option);
    });

  } catch (err) {
    console.error("loadFollowers error:", err);
  }
}


/* ===============================
   LOAD PATIENT LIST
================================ */
async function loadPatients() {
  try {
    const res = await fetch("/api/patients/list");
    const result = await res.json();

    const select = document.getElementById("patientSelect");
    if (!select) return;

    select.innerHTML =
      '<option value="">-- เลือกผู้ป่วย --</option>';

    const patients = result.data || result;
    if (!Array.isArray(patients)) return;

    patients.forEach(p => {
      const option = document.createElement("option");

      option.value = p.CID;
      option.textContent =
        `${p.CID} - ${p.NAME} ${p.LNAME}`;

      option.dataset.name  = p.NAME;
      option.dataset.lname = p.LNAME;

      select.appendChild(option);
    });

  } catch (err) {
    console.error("❌ loadPatients error:", err);
  }
}

/* ===============================
   PATIENT SELECT → AUTO FILL
================================ */
document.addEventListener("change", function (e) {

  if (e.target?.id === "patientSelect") {

    const selected =
      e.target.options[e.target.selectedIndex];
    if (!selected) return;

    document.getElementById("p_name").value =
      selected.dataset.name || "";

    document.getElementById("p_lname").value =
      selected.dataset.lname || "";

    document.getElementById("p_cid").value =
      e.target.value || "";
  }
});

/* ===============================
   LINE SELECT → AUTO FILL
================================ */
document.addEventListener("change", function (e) {

  if (e.target?.id === "lineSelect") {

    const selected =
      e.target.options[e.target.selectedIndex];
    if (!selected) return;

    const pictureUrl =
      selected.dataset.pictureurl || "";

    document.getElementById("l_displayName").value =
      selected.dataset.displayname || "";

    document.getElementById("l_userId").value =
      selected.dataset.userid || "";

    document.getElementById("l_status").value =
      selected.dataset.status || "";

    document.getElementById("l_picture").value =
      selected.dataset.picture || "";

    document.getElementById("l_pictureUrl").value =
      pictureUrl;

    // ✅ แสดงรูป preview
    const img = document.getElementById("linePreview");

    if (pictureUrl) {
      img.src = pictureUrl;
      img.style.display = "inline-block";
    } else {
      img.style.display = "none";
    }
  }
});

/* ===============================
   SAVE FOLLOW LINK
================================ */
document.addEventListener("submit", async function (e) {

  if (!e.target.matches("#addFollowerForm")) return;

  e.preventDefault();

  const payload = {
  cid: document.getElementById("p_cid").value,
  name: document.getElementById("p_name").value,
  lname: document.getElementById("p_lname").value,
  userId: document.getElementById("l_userId").value,
  displayName: document.getElementById("l_displayName").value,
  status: document.getElementById("l_status").value,
  picture: document.getElementById("l_picture").value,
  pictureUrl: document.getElementById("l_pictureUrl").value
};
  const res = await fetch("/api/lineuid/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json();

  if (json.success) {

  await Swal.fire({
  icon: "success",
  title: "บันทึกสำเร็จ",
  text: "เชื่อม LINE UID เรียบร้อยแล้ว",
  timer: 1500,
  showConfirmButton: false
});

  const modalEl = document.getElementById("addFollowerModal");

  // 1️⃣ เอา focus ออกจากปุ่มก่อน
  if (document.activeElement) {
    document.activeElement.blur();
  }

  // 2️⃣ ปิด modal
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();

  // 3️⃣ ค่อย reload ตาราง
  loadLineUIDTable();
}
});



document.addEventListener("click", async function (e) {

  if (!e.target.classList.contains("delete-btn")) return;

  const cid = e.target.dataset.cid;

  const result = await Swal.fire({
    title: "ยืนยันการลบ?",
    text: "ข้อมูลนี้จะถูกลบถาวร!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "ลบข้อมูล",
    cancelButtonText: "ยกเลิก",
    reverseButtons: true
  });

  if (!result.isConfirmed) return;

  try {

    Swal.fire({
      title: "กำลังลบ...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const res = await fetch(`/api/lineuid/delete/${cid}`, {
      method: "DELETE"
    });

    const json = await res.json();

    if (!json.success) throw new Error();

    await Swal.fire({
      icon: "success",
      title: "ลบสำเร็จ",
      text: "ข้อมูลถูกลบเรียบร้อยแล้ว",
      timer: 1500,
      showConfirmButton: false
    });

    loadLineUIDTable();

  } catch (err) {

    Swal.fire({
      icon: "error",
      title: "เกิดข้อผิดพลาด",
      text: "ไม่สามารถลบข้อมูลได้"
    });

  }

});