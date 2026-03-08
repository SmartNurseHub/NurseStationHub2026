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
   POST /api/patients/create
   - บันทึกผู้ป่วย 1 ราย (Manual Entry)
   - ใช้กับ Google Sheet
   - เรียกจาก patients.client.js
================================================= */
exports.createPatient = async (req, res) => {
  try {
    const {
      citizenId,
      firstName,
      lastName,
      birthDate,
      phone
    } = req.body;

    /* ---------- Normalize CID ---------- */
    const CID = normalizeCID(citizenId);

    if (!CID || CID.length !== 13) {
      return res.status(400).json({
        success: false,
        message: "Citizen ID ไม่ถูกต้อง"
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ครบ"
      });
    }

    /* ---------- ส่งต่อให้ Service ---------- */
    const result = await service.createPatientService({
      CID,
      NAME: firstName,
      LNAME: lastName,
      BIRTH: birthDate || "",
      MOBILE: phone || ""
    });

    res.json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error("CREATE PATIENT ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Server error"
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


/* =================================================
   GET /api/patients/:cid
   - ค้นหาผู้ป่วยด้วย CID
   - ใช้โดย Vaccination / NursingRecords
================================================= */
exports.getPatientByCID = async (req, res) => {
  try {

    const cid = req.params.cid;

    const patient = await service.getPatientByCID(cid);

    if (!patient) {
      return res.status(404).json({
        success:false,
        message:"Patient not found"
      });
    }

    res.json({
      success:true,
      data:patient
    });

  } catch(err){

    console.error("getPatientByCID error", err);

    res.status(500).json({
      success:false,
      message:"Server error"
    });

  }
};


