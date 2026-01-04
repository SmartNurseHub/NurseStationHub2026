// =======================================================
// Upload Controller — Render Safe (No file storage)
// =======================================================

const { google } = require("googleapis");
const parseTxt = require("../helpers/parseTxt");

exports.uploadPatients = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file" });
    }

    const rows = parseTxt(req.file.buffer.toString("utf8"));
    if (!rows.length) {
      return res.json({ success: false, message: "No data" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.SPREADSHEET_ID;
    const range = "Patients!A1";

    const resSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range
    });

    const existing = resSheet.data.values || [];
    const header = existing.shift() || [];

    let newRows = 0;
    let updatedRows = 0;

    rows.forEach(row => {
      const index = existing.findIndex(r => r[0] === row.HN);
      const values = header.map(h => row[h] || "");

      if (index === -1) {
        existing.push(values);
        newRows++;
      } else {
        existing[index] = values;
        updatedRows++;
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Patients!A2",
      valueInputOption: "RAW",
      requestBody: { values: existing }
    });

    res.json({
      success: true,
      totalRows: existing.length,
      newRows,
      updatedRows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
