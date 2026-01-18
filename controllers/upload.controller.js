/*************************************************
 * controllers/upload.controller.js
 * -----------------------------------------------
 * Controller: Upload TXT (Text Input)
 *
 * หน้าที่:
 * - รับ raw text จาก Frontend
 * - parse / filter / validate
 * - บันทึกข้อมูลผู้ป่วยลง Google Sheet
 *
 * ถูกเรียกจาก:
 * - POST /api/upload/text
 *************************************************/

const {
  parseTxt,
  filterColumns,
  filterRowsByCID,
  appendToSheet
} = require("../services/upload.service");

/* =================================================
   POST /api/upload/text
================================================= */
exports.uploadTxt = async (req, res) => {
  try {
    const { text } = req.body;

    // ✅ Validate input
    if (typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Text input is required"
      });
    }

    // Parse + filter data
    let rows = parseTxt(text);
    rows = filterColumns(rows);
    rows = filterRowsByCID(rows);

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid patient records found"
      });
    }

    await appendToSheet(rows);

    res.json({
      success: true,
      count: rows.length
    });

  } catch (err) {
    console.error("UPLOAD TXT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to upload text"
    });
  }
};
