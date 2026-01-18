/*************************************************
 * controllers/patients.controller.js (FINAL)
 *************************************************/

const { importPatientsService } = require("../services/patients.service");

async function importPatients(req, res) {
  try {
    const rows = req.body;

    console.log("📥 importPatients body:", rows?.length);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        saved: 0,
        message: "Invalid payload"
      });
    }

    const saved = await importPatientsService(rows);

    return res.json({
      success: true,
      saved: saved   // ⭐ บังคับมี key นี้เสมอ
    });

  } catch (err) {
    console.error("❌ importPatients error:", err);

    return res.status(500).json({
      success: false,
      saved: 0,
      message: "Internal server error"
    });
  }
}

module.exports = {
  importPatients
};
