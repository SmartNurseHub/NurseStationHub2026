// =======================================================
// Upload Controller — Render Production Safe
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

    /* ================= GOOGLE AUTH ================= */
    const credentials = JSON.parse(
      Buffer.from(
        process.env.GOOGLE_CREDENTIAL_BASE64,
        "base64"
      ).toString()
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    /* ================= SHEET CONFIG ================= */
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = process.env.SHEET_PATIENTS || "Patients";

    /* ================= READ EXISTING ================= */
    const readResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const values = readResp.data.values || [];
    if (!values.length) {
      return res.status(500).json({
        success: false,
        message: "Sheet has no header",
      });
    }

    const header = values[0];
    const existing = values.slice(1);

    let newRows = 0;
    let updatedRows = 0;

    rows.forEach(row => {
      const hnIndex = header.indexOf("HN");
      const foundIndex = existing.findIndex(
        r => r[hnIndex] === row.HN
      );

      const rowValues = header.map(h => row[h] || "");

      if (foundIndex === -1) {
        existing.push(rowValues);
        newRows++;
      } else {
        existing[foundIndex] = rowValues;
        updatedRows++;
      }
    });

    /* ================= WRITE BACK ================= */
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A2`,
      valueInputOption: "RAW",
      requestBody: {
        values: existing,
      },
    });

    res.json({
      success: true,
      totalRows: existing.length,
      newRows,
      updatedRows,
    });

  } catch (err) {
    console.error("Upload patients error:", err);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};
