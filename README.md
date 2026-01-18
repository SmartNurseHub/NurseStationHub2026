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
git commit -m "ข้อความ"
git pull origin main  # ดึงก่อน เผื่อมีคนแก้ก่อน
git push origin main

เลือกไฟล์
 → อ่านไฟล์ .txt (ยังไม่อัปโหลด)
 → แสดงข้อมูลเป็นตาราง (ค้นหา / เลือกได้)
 → ผู้ใช้ติ๊กเลือกเฉพาะแถวที่ต้องการ
 → กด “บันทึกลงระบบ”
 → ส่งเฉพาะแถวที่เลือกไป backend



NurseStationHub2026
 ┣ public
 ┃ ┣ image
 ┃ ┃ ┗ LOGO.png
 ┃ ┣ js
 ┃ ┃ ┣ dashboard.js
 ┃ ┃ ┣ patients.js
 ┃ ┃ ┗ upload.js
 ┃ ┣ views
 ┃ ┃ ┣ appointments.html
 ┃ ┃ ┣ dashboard.html
 ┃ ┃ ┣ nursingRecords.html
 ┃ ┃ ┣ patients.html
 ┃ ┃ ┣ reports.html
 ┃ ┃ ┗ settings.html
 ┃ ┣ app.js
 ┃ ┣ index.html
 ┃ ┗ style.css
 ┣ routes
 ┃ ┣ patients.routes.js
 ┃ ┗ upload.routes.js
 ┣ controllers
 ┃ ┣ patients.controller.js
 ┃ ┗ upload.controller.js
 ┣ services
 ┃ ┣ patients.service.js
 ┃ ┣ sheets.controller.js
 ┃ ┗ upload.service.js
 ┣ uploads
 ┣ .env
 ┣ package-lock.json
 ┣ package.json
 ┣ README.md
 ┗ server.js