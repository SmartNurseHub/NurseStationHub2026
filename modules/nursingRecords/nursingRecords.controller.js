/******************************************************************
 * modules/nursingRecords/nursingRecords.controller.js
 ******************************************************************/
const service = require("./nursingRecords.service");

/* =========================================================
   GET /api/nursingRecords
========================================================= */
exports.getAll = async (req, res) => {
  try {
    const records = await service.getAll();
    res.json(records);
  } catch (err) {
    console.error("❌ getAll error:", err);
    res.status(500).json({ message: "Failed to load nursing records" });
  }
};

/* =========================================================
   GET /api/nursingRecords/next-nsr
========================================================= */
exports.getNextNSR = async (req, res) => {
  try {
    const nsr = await service.getNextNSR();
    res.json({ nsr });
  } catch (err) {
    console.error("❌ getNextNSR error:", err);
    res.status(500).json({ message: "Failed to generate NSR" });
  }
};


/* =========================================================
   POST /api/nursingRecords
========================================================= */
exports.save = async (req, res) => {
  try {
    await service.save(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ save error:", err);
    res.status(500).json({ message: "Failed to save nursing record" });
  }
};


/* =================================================
   POST /api/patients/batch
================================================= */
exports.batchSave = async (req, res) => {
  try {
    const rows = req.body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No data" });
    }

    await service.batchSave(rows);
    res.json({ success: true, count: rows.length });

  } catch (err) {
    console.error("❌ batchSave error:", err);
    res.status(500).json({ message: "Batch save failed" });
  }
};
