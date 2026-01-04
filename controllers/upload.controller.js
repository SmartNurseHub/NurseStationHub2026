// =======================================================
// Upload Controller — Production Ready (Append + Update)
// =======================================================

const { google } = require("googleapis");
const parseTxt = require("../helpers/parseTxt");

/* ================= GOOGLE CLIENT ================= */
function getSheetsClient() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64").toString()
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/* ================= CONTROLLER ================= */
exports.uploadPatients = async (req, res) => {
  try {
    /* ---------- 1. validate file ---------- */
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const rows = parseTxt(req.file.buffer.toString("utf8"));
    if (!rows.length) {
      return res.json({
        success: false,
        message: "No valid data",
      });
    }

    /* ---------- 2. sheet config ---------- */
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = process.env.SHEET_PATIENTS || "Patients";
    const sheets = getSheetsClient();

    /* ---------- 3. read sheet ---------- */
    const readResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const values = readResp.data.values || [];
    if (!values.length) {
      return res.status(500).json({
        success: false,
        message: "Sheet header not found",
      });
    }

    const header = values[0];
    const dataRows = values.slice(1);

    /* ---------- 4. find HN column ---------- */
    const hnIndex = header.indexOf("HN");
    if (hnIndex === -1) {
      return res.status(500).json({
        success: false,
        message: "HN column not found in sheet",
      });
    }

    let processedRows = 0;
    let newRows = 0;
    let updatedRows = 0;

    /* ---------- 5. process rows ---------- */
    for (const row of rows) {
      if (!row.HN) continue;
       processedRows++;

      const rowValues = header.map(h => row[h] || "");
      const foundIndex = dataRows.findIndex(
        r => r[hnIndex] === row.HN
      );
      

      // ---- ADD NEW ----
      if (foundIndex === -1) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: sheetName,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [rowValues],
          },
        });
        newRows++;
      }
      // ---- UPDATE EXISTING ----
      else {
        const rowNumber = foundIndex + 2; // + header
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A${rowNumber}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [rowValues],
          },
        });
        updatedRows++;
      }
    }

    /* ---------- 6. response ---------- */
    console.log(
      `✅ Upload Patients: new=${newRows}, updated=${updatedRows}`
    );

    res.json({
  success: true,
  totalInFile: rows.length,          // จำนวนข้อมูลในไฟล์
  processed: processedRows,          // จำนวนที่นำไปประมวลผล
  newRows,                           // เพิ่มใหม่
  updatedRows,                       // อัปเดต
});

  } catch (err) {
    console.error("🔥 uploadPatients error:", err);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};
