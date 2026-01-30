/******************************************************************
 * modules/nursingRecords/nursingRecords.controller.js
 * FINAL STANDARD – MATCH nursingRecords.service.js
 ******************************************************************/
const service = require("./nursingRecords.service");

/* =========================================================
   GET /api/nursingRecords
========================================================= */
exports.getAll = async (req, res) => {
  try {
    const records = await service.getAll();
    res.json({ data: records });
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
   POST /api/nursingRecords   (CREATE)
========================================================= */
exports.save = async (req, res) => {
  try {
    if (!req.body.NSR) {
      return res.status(400).json({ message: "NSR is required" });
    }

    await service.save(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ save error:", err);
    res.status(500).json({ message: "Failed to save nursing record" });
  }
};

/* =========================================================
   PUT /api/nursingRecords/:nsr   (UPDATE)
========================================================= */
exports.update = async (req, res) => {
  try {
    const { nsr } = req.params;
    if (!nsr) {
      return res.status(400).json({ message: "NSR is required" });
    }

    await service.updateByNSR(nsr, req.body);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ update error:", err);
    res.status(500).json({ message: "Failed to update nursing record" });
  }
};

/* =========================================================
   DELETE /api/nursingRecords/:nsr   (SOFT DELETE)
========================================================= */
exports.delete = async (req, res) => {
  try {
    const { nsr } = req.params;
    console.log("🔥 DELETE API HIT", nsr);

    await service.deleteByNSR(nsr);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

