const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

exports.getNursingRecords = async (req, res) => {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: process.env.SHEET_NURSING
    });

    res.json({ success: true, data: result.data.values || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
