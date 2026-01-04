เว็บมี Backend (Node.js / Express / API / Google Sheet)

มี server.js

มี /api

ใช้ npm install

เรียก Google Sheet, Database ฯลฯ

➡ ต้องใช้ Server จริง (VPS / Render / Railway / Cloud)

Deploy บน Railway และ Render

NurseStationHub2026
 ┣ config
 ┃ ┗ credentials.json
 ┣ controllers
 ┃ ┗ upload.controller.js
 ┣ helpers
 ┃ ┗ parseTxt.js
 ┣ public
 ┃ ┣ image
 ┃ ┃ ┗ logo.png
 ┃ ┣ js
 ┃ ┃ ┣ app.js
 ┃ ┃ ┣ nursingRecords.js
 ┃ ┃ ┗ patients.js
 ┃ ┣ appointments.html
 ┃ ┣ dashboard.html
 ┃ ┣ index.html
 ┃ ┣ nursingRecords.html
 ┃ ┣ patients.html
 ┃ ┣ sticker.html
 ┃ ┗ style.css
 ┣ routes
 ┃ ┗ sheets.js
 ┣ uploads
 ┣ .env
 ┣ .gitignore
 ┣ package-lock.json
 ┣ package.json
 ┣ READE2.md
 ┣ README.md
 ┗ server.js