/public
│
├─ index.html        ← ไฟล์ที่คุณส่งมา
├─ style.css         ← CSS ที่คุณส่งมา
├─ app.js            ← (ใหม่) ตัวควบคุมระบบทั้งหมด
│
├─ views/
│   ├─ dashboard.html
│   ├─ patients.html
│   ├─ nursingRecords.html
│   ├─ appointments.html
│   ├─ reports.html
│   └─ settings.html



node server.js
netstat -ano | findstr :3000
taskkill /PID <PID> /F

git status
git add .
git commit -m "modified1"
git pull origin main  # ดึงก่อน เผื่อมีคนแก้ก่อน
git push origin main

เลือกไฟล์
 → อ่านไฟล์ .txt (ยังไม่อัปโหลด)
 → แสดงข้อมูลเป็นตาราง (ค้นหา / เลือกได้)
 → ผู้ใช้ติ๊กเลือกเฉพาะแถวที่ต้องการ
 → กด “บันทึกลงระบบ”
 → ส่งเฉพาะแถวที่เลือกไป backend




โครงสร้าง
 ┗ NurseStationHub2026
 ┃ ┣ config
 ┃ ┃ ┗ google.js
 ┃ ┣ modules
 ┃ ┃ ┣ appointments
 ┃ ┃ ┃ ┗ appointments.routes.js
 ┃ ┃ ┣ dashboard
 ┃ ┃ ┃ ┣ dashboard.client.js
 ┃ ┃ ┃ ┣ dashboard.controller.js
 ┃ ┃ ┃ ┣ dashboard.routes.js
 ┃ ┃ ┃ ┣ dashboard.service.js
 ┃ ┃ ┃ ┗ dashboard.view.html
 ┃ ┃ ┣ lineOA
 ┃ ┃ ┃ ┣ lineOA.controller.js
 ┃ ┃ ┃ ┣ lineOA.line.service.js
 ┃ ┃ ┃ ┣ lineOA.routes.js
 ┃ ┃ ┃ ┣ lineOA.schema.js
 ┃ ┃ ┃ ┗ lineOA.service.js
 ┃ ┃ ┣ nursingRecords
 ┃ ┃ ┃ ┣ views
 ┃ ┃ ┃ ┃ ┣ nursingRecords.counselor.view.html
 ┃ ┃ ┃ ┃ ┗ nursingRecords.online.view.html
 ┃ ┃ ┃ ┣ audit.service.js
 ┃ ┃ ┃ ┣ nursingRecords.client.js
 ┃ ┃ ┃ ┣ nursingRecords.controller.js
 ┃ ┃ ┃ ┣ nursingRecords.counselor.actions.js
 ┃ ┃ ┃ ┣ nursingRecords.counselor.client.js
 ┃ ┃ ┃ ┣ nursingRecords.online.actions.js
 ┃ ┃ ┃ ┣ nursingRecords.online.client.js
 ┃ ┃ ┃ ┣ nursingRecords.print.js
 ┃ ┃ ┃ ┣ nursingRecords.routes.js
 ┃ ┃ ┃ ┣ nursingRecords.service.js
 ┃ ┃ ┃ ┗ nursingRecords.view.html
 ┃ ┃ ┣ patientCore
 ┃ ┃ ┃ ┗ patientCore.client.js
 ┃ ┃ ┣ patients
 ┃ ┃ ┃ ┣ patients.client.js
 ┃ ┃ ┃ ┣ patients.controller.js
 ┃ ┃ ┃ ┣ patients.routes.js
 ┃ ┃ ┃ ┣ patients.service.js
 ┃ ┃ ┃ ┗ patients.view.html
 ┃ ┃ ┗ upload
 ┃ ┃ ┃ ┗ upload.routes.js
 ┃ ┣ public
 ┃ ┃ ┣ assets
 ┃ ┃ ┃ ┣ css
 ┃ ┃ ┃ ┃ ┗ main.css
 ┃ ┃ ┃ ┣ images
 ┃ ┃ ┃ ┃ ┗ LOGO.png
 ┃ ┃ ┃ ┗ js
 ┃ ┃ ┃ ┃ ┗ date.utils.js
 ┃ ┃ ┣ core
 ┃ ┃ ┃ ┣ app.js
 ┃ ┃ ┃ ┗ patient.shared.js
 ┃ ┃ ┗ js
 ┃ ┃ ┃ ┗ patients.js
 ┃ ┣ routes
 ┃ ┃ ┗ index.js
 ┃ ┣ uploads
 ┃ ┃ ┣ nursingRecords.client.js
 ┃ ┃ ┣ nursingRecords.counselor.view.html
 ┃ ┃ ┗ nursingRecords.view.html
 ┃ ┣ views
 ┃ ┃ ┗ index.html
 ┃ ┣ .env
 ┃ ┣ cloudflared.exe
 ┃ ┣ package-lock.json
 ┃ ┣ package.json
 ┃ ┣ README.md
 ┃ ┗ server.js




 const questions = [
  "ระยะเวลารอรับบริการมีความเหมาะสม",
  "ขั้นตอนการรับบริการเป็นไปอย่างต่อเนื่อง ไม่ซับซ้อน",
  "ความสุภาพและเป็นมิตรของเจ้าหน้าที่",
  "ความใส่ใจและการรับฟังของแพทย์/พยาบาล",
  "คำอธิบายเกี่ยวกับอาการและการรักษาเข้าใจง่าย",
  "ความชัดเจนของคำแนะนำในการดูแลตนเองหลังรับบริการ",
  "ความมั่นใจในคุณภาพการรักษาที่ได้รับ",
  "ความพึงพอใจต่อผลลัพธ์การรักษาโดยรวม",
  "ความรู้สึกปลอดภัยและความเชื่อมั่นในคลินิก",
  "โดยรวมแล้ว ท่านพึงพอใจกับการเข้ารับบริการครั้งนี้เพียงใด"
];
