const express = require("express");
const router = express.Router();
const gs = require("../services/googleSheets");

// GET patients
router.get("/patients", async (req, res) => {
  try {
    const data = await gs.getPatients();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST patient
router.post("/patients", async (req, res) => {
  try {
    await gs.addPatient(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
