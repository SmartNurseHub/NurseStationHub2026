/******************************************************************
 * modules/patients/patients.controller.js
 *
 * PATIENTS CONTROLLER — FINAL CLEAN
 *
 * หน้าที่:
 * - รับ HTTP request จาก patients.routes.js
 * - ตรวจสอบ / normalize ข้อมูลเบื้องต้น
 * - ส่งต่อ logic ให้ patients.service.js
 *
 * เชื่อมโยง:
 * - patients.routes.js
 * - patients.service.js
 * - ถูกเรียกจาก:
 *   ├─ patients.client.js
 *   └─ nursingRecords.client.js (search patient)
 ******************************************************************/

const service = require("./patients.service");

/* =================================================
   UTILITIES
   - ใช้ normalize CID ให้เป็นมาตรฐานเดียวกัน
   - ใช้ทั้ง import และ service layer
================================================= */
function normalizeCID(cid) {
  if (!cid) return "";

  cid = String(cid);

  // ป้องกัน CID ที่มาในรูป scientific notation (Excel)
  if (cid.includes("E") || cid.includes("e")) {
    cid = Number(cid).toFixed(0);
  }

  return cid
    .replace(/'/g, "")
    .replace(/\D/g, "")
    .padStart(13, "0");
}

/* =================================================
   POST /api/patients/import
   - Import / Upsert ข้อมูลผู้ป่วย
   - CID-based
   - เรียกจาก patients.client.js
================================================= */
exports.importPatients = async (req, res) => {
  try {
    const rows = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload"
      });
    }

    /* ---------- Normalize + Validate ---------- */
    const validRows = rows
      .map(r => ({
        ...r,
        CID: normalizeCID(r.CID)
      }))
      .filter(r =>
        r.CID &&
        r.CID.length === 13
      );

    if (validRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid patient data"
      });
    }

    /* ---------- Import (Service Layer) ---------- */
    const result = await service.importPatientsService(validRows);

    res.json({
      success: true,
      inserted: result.inserted,
      updated: result.updated
    });

  } catch (err) {
    console.error("IMPORT PATIENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =================================================
   GET /api/patients/search?q=xxx
   - ค้นหาผู้ป่วยแบบ realtime
   - ใช้สำหรับ autocomplete / list
   - เรียกจาก nursingRecords.client.js
================================================= */
exports.searchPatients = async (req, res) => {
  try {
    const keyword = req.query.q || "";
    const data = await service.searchPatients(keyword);

    // 🔥 สำคัญ: ส่ง array ตรง ๆ
    res.json(data);

  } catch (err) {
    console.error("❌ searchPatients error:", err);
    res.status(500).json([]);
  }
};

exports.getPatientsList = async (req, res) => {
  try {
    const data = await service.getAllPatients();  // ✅ ใช้ service

    res.json({
      success: true,
      data: data || []
    });

  } catch (err) {
    console.error("GET PATIENT LIST ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

