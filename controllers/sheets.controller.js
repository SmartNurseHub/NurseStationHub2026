const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

/**
 * GET /api/sheets/:sheet
 * อ่านข้อมูลจาก Google Sheet
 */
exports.readSheet = async (req, res) => {
  try {
    const sheetName = req.params.sheet;
    if (!sheetName) {
      return res.status(400).json({
        success: false,
        message: "Missing sheet name"
      });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: sheetName
    });

    res.json({
      success: true,
      data: result.data.values || []
    });
  } catch (err) {
    console.error("READ SHEET ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
