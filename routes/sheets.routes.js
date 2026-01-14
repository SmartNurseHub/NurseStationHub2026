const router = require("express").Router();
const sheetsController = require("../controllers/sheets.controller");

/**
 * GET /api/sheets/:sheet
 * ตัวอย่าง: /api/sheets/Patients
 */
router.get("/:sheet", sheetsController.readSheet);

module.exports = router;
