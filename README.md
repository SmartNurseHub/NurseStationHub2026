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



NurseStationHub2026
│
├── config
│   ├── env.js
│   ├── google.config.js
│   └── index.js
│
├── modules                ← ⭐ แยกตาม Feature
│   ├── dashboard
│   │   ├── dashboard.controller.js
│   │   ├── dashboard.routes.js
│   │   ├── dashboard.service.js
│   │   └── dashboard.view.html
│   ├── nursingRecords
│   │   ┣ audit.service.js
│   │   ┣ nursingRecords.client.js
│   │   ┣ nursingRecords.controller.js
│   │   ┣ nursingRecords.routes.js
│   │   ┣ nursingRecords.service.js
│   │   ┗ nursingRecords.view.html
│   ├── nursingCounselor
│   │   ┣ nursingCounselor.client.js
│   │   ┗ nursingCounselor.view.html
│   │
│   ├── patients
│   │   ├── patients.controller.js
│   │   ├── patients.routes.js
│   │   ├── patients.service.js
│   │   ├── patients.view.html
│   │   └── patients.client.js
│   │
│   ├── appointments
│   │   ├── appointments.controller.js
│   │   ├── appointments.routes.js
│   │   ├── appointments.service.js
│   │   ├── appointments.view.html
│   │   └── appointments.client.js
│   │
│   ├── upload
│   │   ├── upload.controller.js
│   │   ├── upload.routes.js
│   │   └── upload.service.js
│   │
│   └── reports
│       ├── reports.controller.js
│       ├── reports.routes.js
│       ├── reports.service.js
│       └── reports.view.html
│
├── public
│   ├── assets
│   │   ├── images
│   │   │   └── LOGO.png
│   │   └── css
│   │       └── main.css
│   │
│   ├── core
│   │   ├── app.js          ← global js (sidebar, loadView)
│   │   └── api.js          ← fetch wrapper
│   │
│   └── vendor             ← lib ภายนอก (ถ้ามี)
│
├── uploads                ← file upload จริง
│
├── routes
│   └── index.js            ← รวม routes ทุก module
│
├── views
│   ├── layout
│   │   ├── header.html
│   │   ├── sidebar.html
│   │   └── footer.html
│   │
│   └── index.html          ← shell หลัก
│
├── .env
├── server.js
├── package.json
└── README.md
