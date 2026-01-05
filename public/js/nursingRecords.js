const express = require("express");
const router = express.Router();
const { google } = require("googleapis");

const SHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = "NursingRecords";

/* ================= GOOGLE AUTH ================= */
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(
    Buffer.from(
      process.env.GOOGLE_CREDENTIAL_BASE64,
      "base64"
    ).toString("utf8")
  ),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheet() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

/* =================================================
   GET ALL NURSING RECORDS
   GET /api/sheet/nursing-records
================================================= */
router.get("/nursing-records", async (req, res) => {
  try {
    const sheets = await getSheet();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
    });

    const values = result.data.values || [];
    if (values.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const [header, ...rows] = values;

    const data = rows.map(row =>
      Object.fromEntries(
        header.map((h, i) => [h, row[i] || ""])
      )
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error("GET nursing-records:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* =================================================
   GET ONE BY NSR
   GET /api/sheet/nursing-records/:nsr
================================================= */
router.get("/nursing-records/:nsr", async (req, res) => {
  try {
    const sheets = await getSheet();
    const nsr = String(req.params.nsr).trim();

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
    });

    const values = result.data.values || [];
    if (values.length < 2) {
      return res.json({ success: false });
    }

    const [header, ...rows] = values;

    const rowIndex = rows.findIndex(
      r => String(r[0]).trim() === nsr
    );

    if (rowIndex === -1) {
      return res.json({ success: false });
    }

    const data = Object.fromEntries(
      header.map((h, i) => [h, rows[rowIndex][i] || ""])
    );

    res.json({
      success: true,
      data,
      rowIndex: rowIndex + 2, // real sheet row
    });
  } catch (err) {
    console.error("GET nursing-record by NSR:", err);
    res.status(500).json({ success: false });
  }
});

/* =================================================
   UPDATE BY NSR
   PUT /api/sheet/nursing-records/:nsr
================================================= */
router.put("/nursing-records/:nsr", async (req, res) => {
  try {
    const sheets = await getSheet();
    const nsr = String(req.params.nsr).trim();

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
    });

    const values = sheetData.data.values || [];
    if (values.length < 2) {
      return res.json({ success: false });
    }

    const [header, ...rows] = values;

    const rowIndex = rows.findIndex(
      r => String(r[0]).trim() === nsr
    );

    if (rowIndex === -1) {
      return res.json({ success: false });
    }

    /* เรียงค่าตาม header */
    const updatedRow = header.map(h => req.body[h] ?? "");

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [updatedRow],
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE nursing-record:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
