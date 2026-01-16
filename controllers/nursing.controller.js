/******************************************************************
 * controllers/nursing.controller.js
 ******************************************************************/

const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

/* ================= CONFIG ================= */
const SPREADSHEET_ID =
  process.env.SPREADSHEET_NURSING_ID ||
  process.env.SPREADSHEET_PATIENTS_DATA_001_ID;

const SHEET_NAME = "NursingRecords"; // ✅ แก้ได้ตาม Sheet จริง
const START_ROW = 2; // row 1 = header

/* =========================================================
 * GET /api/nursing
 * ======================================================= */
exports.listNursingRecords = async (req, res) => {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${START_ROW}:Z`
    });

    const rows = result.data.values || [];

    // ❗ ส่ง array ล้วน เพื่อให้ frontend ใช้ forEach ได้ทันที
    const records = rows.map((r) => ({
      date: r[0] || "",
      time: r[1] || "",
      patient: r[2] || "",
      note: r[3] || "",
      nurse: r[4] || ""
    }));

    res.json(records);

  } catch (err) {
    console.error("❌ listNursingRecords error:", err);
    res.status(500).json([]);
  }
};
