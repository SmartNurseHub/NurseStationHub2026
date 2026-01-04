/********************************************************************
 * patientsUpload.controller.js
 * Upload PERSON (HOSxP / HDC) → Google Sheet
 * - รองรับ pipe (|)
 * - ล้าง TAB
 * - กัน CID ซ้ำ
 * - Insert header อัตโนมัติ
 ********************************************************************/

const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS || "Patients";
const BATCH_SIZE = 1000;

// ---------------------------------------------------------------------
// Google Auth
// ---------------------------------------------------------------------
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64")
    .toString("utf8")
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

// ---------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------
function colIndexToLetter(index) {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

// ---------------------------------------------------------------------
// Upload PERSON
// ---------------------------------------------------------------------
exports.uploadPatients = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("Upload:", req.file.originalname, req.file.size);

    const sheets = await getSheets();

    // -----------------------------------------------------------------
    // 1) Read + clean file
    // -----------------------------------------------------------------
    const content = req.file.buffer.toString("utf8");

    // 🔥 สำคัญมาก: ล้าง TAB และห้าม trim ทั้งบรรทัด
    const lines = content
      .replace(/\t+/g, "")
      .split(/\r?\n/)
      .filter(l => l.trim() !== "");

    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        message: "File has no data rows",
      });
    }

    // -----------------------------------------------------------------
    // 2) Header
    // -----------------------------------------------------------------
    const headerLine = lines[0];
    const headers = headerLine
      .replace(/^\uFEFF/, "") // remove BOM
      .split("|")
      .map(h => h.trim());

    const dataLines = lines.slice(1);

    console.log("Columns:", headers.length);
    console.log("Rows:", dataLines.length);

    // -----------------------------------------------------------------
    // 3) CID key
    // -----------------------------------------------------------------
    const KEY_NAME = "CID";
    const keyColIndex = headers.indexOf(KEY_NAME);

    if (keyColIndex === -1) {
      throw new Error("CID column not found");
    }

    const keyColLetter = colIndexToLetter(keyColIndex);

    // -----------------------------------------------------------------
    // 4) Load existing data from Sheet
    // -----------------------------------------------------------------
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!A:ZZ`,
    });

    const sheetValues = sheetRes.data.values || [];
    const existingKeySet = new Set();

    // ถ้ามีข้อมูลใน Sheet
    if (sheetValues.length > 1) {
      const sheetHeaders = sheetValues[0];
      const cidIndexInSheet = sheetHeaders.indexOf(KEY_NAME);

      if (cidIndexInSheet !== -1) {
        for (let i = 1; i < sheetValues.length; i++) {
          const cid = sheetValues[i][cidIndexInSheet];
          if (cid) existingKeySet.add(cid);
        }
      }
    }

    console.log("Existing CID:", existingKeySet.size);

    // -----------------------------------------------------------------
    // 5) Insert header if sheet empty
    // -----------------------------------------------------------------
    if (sheetValues.length === 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_PATIENTS,
        valueInputOption: "RAW",
        requestBody: {
          values: [headers],
        },
      });
      console.log("Header inserted");
    }

    // -----------------------------------------------------------------
    // 6) Parse rows
    // -----------------------------------------------------------------
    let inserted = 0;
    let skipped = 0;
    const toAppend = [];

    for (const line of dataLines) {
      const cols = line.split("|");

      const row = headers.map((_, i) =>
        (cols[i] ?? "").trim()
      );

      const cid = row[keyColIndex];

      // validate CID
      if (!cid || cid.length !== 13) {
        skipped++;
        continue;
      }

      if (existingKeySet.has(cid)) {
        skipped++;
        continue;
      }

      toAppend.push(row);
      existingKeySet.add(cid);
      inserted++;
    }

    console.log(`Inserted=${inserted}, Skipped=${skipped}`);

    // -----------------------------------------------------------------
    // 7) Batch append
    // -----------------------------------------------------------------
    for (let i = 0; i < toAppend.length; i += BATCH_SIZE) {
      const batch = toAppend.slice(i, i + BATCH_SIZE);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_PATIENTS,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: batch,
        },
      });

      console.log(`Append ${i + 1}-${i + batch.length}`);
    }

    // -----------------------------------------------------------------
    // 8) Response
    // -----------------------------------------------------------------
    res.json({
      success: true,
      totalInFile: dataLines.length,
      inserted,
      skipped,
      key: KEY_NAME,
    });

  } catch (err) {
    console.error("uploadPatients error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
