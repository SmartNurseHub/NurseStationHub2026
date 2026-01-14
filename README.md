git status
git add .
git commit -m "ข้อความ"
git pull origin main  # ดึงก่อน เผื่อมีคนแก้ก่อน
git push origin main

node server.js
netstat -ano | findstr :3000
taskkill /PID <PID> /F

smart-nurse-hub/
│
├─ server.js                # Entry point ของ Backend (Express)
├─ package.json             # Dependencies + scripts
├─ .gitignore
├─ .env.example             # ตัวอย่าง ENV สำหรับ Render / Railway
├─ render.yaml              # Config deploy บน Render
│
├─ controllers/             # Logic ฝั่ง Backend (ไม่ผูกกับ route)
│  ├─ sheets.controller.js  # อ่าน/เขียน Google Sheets (core)
│  ├─ patients.controller.js# Logic ผู้รับบริการ (GET / UPLOAD)
│  └─ nursing.controller.js # Logic งานพยาบาล
│
├─ helpers/                 # ฟังก์ชันช่วยเหลือ (pure functions)
│  ├─ googleAuth.js         # Auth Google Service Account
│  └─ parseTxt.js           # แปลง txt / csv → array
│
├─ routes/                  # API Routes (mapping URL → controller)
│  ├─ sheets.routes.js      # /api/sheets/*
│  ├─ patients.routes.js    # /api/patients/*
│  └─ nursing.routes.js     # /api/nursing/*
│
├─ scripts/
│  ┣ createPatientsSpreadsheet.js
   ┣ initIndex.js
   ┣ initMeta.js
   ┣ initPatientsHeader.js
   ┣ syncPatientsMeta.js
   ┗ testWrite.js

│
└─ public/                  # Frontend (Static SPA)
   │
   ├─ index.html            # หน้าเดียวหลัก (SPA shell) ✅
   ├─ app.js                # Router ฝั่ง client + sidebar + nav
   ├─ patients.js           # Logic เฉพาะหน้า patients ✅
   ├─ nursing.js            # (อนาคต) logic nursingRecords
   ├─ style.css             # CSS รวม
   │
   ├─ image/
   │  └─ logo.png
   │
   └─ views/                # HTML partial (โหลดด้วย fetch)
      ├─ dashboard.html
      ├─ patients.html
      ├─ nursingRecords.html
      ├─ appointments.html
      ├─ reports.html
      └─ settings.html
