const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS || "Patients";

const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64").toString("utf-8")
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

const BATCH_SIZE = 1000;

exports.uploadPatients = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("Upload file:", req.file.originalname, req.file.size);

    const sheets = await getSheets();

    // ------------------------------------------------------------------
    // 1) อ่านไฟล์
    // ------------------------------------------------------------------
    const content = req.file.buffer.toString("utf-8");
    const lines = content.split(/\r?\n/).filter(l => l.trim());

    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        message: "File has no data rows",
      });
    }

    // ------------------------------------------------------------------
    // 2) แยก header
    // ------------------------------------------------------------------
    const headerLine = lines.shift(); // เอาบรรทัดแรกออก
    const headers = headerLine.split("|");

    console.log("Columns:", headers.length);
    console.log("Data rows:", lines.length);

    // ------------------------------------------------------------------
    // 3) โหลด HN เดิมจาก Sheet (ใช้เป็น key)
    // ------------------------------------------------------------------
    // สมมติว่า HN อยู่ column H (ตามไฟล์คุณ)
    const hnColIndex = headers.indexOf("HN");
    if (hnColIndex === -1) {
      throw new Error("HN column not found in header");
    }

    const sheetHN = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!H:H`,
    });

    const existingHNSet = new Set(
      (sheetHN.data.values || []).flat().filter(Boolean)
    );

    console.log("Existing HN:", existingHNSet.size);

    // ------------------------------------------------------------------
    // 4) แปลงไฟล์ → rows
    // ------------------------------------------------------------------
    let newRows = 0;
    let skippedRows = 0;
    const toAppend = [];

    for (const line of lines) {
      const values = line.split("|");

      // map เป็น row เต็มตาม header
      const row = headers.map((_, i) => values[i] ?? "");

      const hn = row[hnColIndex];

      if (!hn) {
        skippedRows++;
        continue;
      }

      if (existingHNSet.has(hn)) {
        skippedRows++;
        continue;
      }

      toAppend.push(row);
      existingHNSet.add(hn);
      newRows++;
    }

    console.log(`New: ${newRows}, Skipped: ${skippedRows}`);

    // ------------------------------------------------------------------
    // 5) Append แบบ batch
    // ------------------------------------------------------------------
    for (let i = 0; i < toAppend.length; i += BATCH_SIZE) {
      const batch = toAppend.slice(i, i + BATCH_SIZE);

      console.log(`Appending ${i + 1} - ${i + batch.length}`);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_PATIENTS,
        valueInputOption: "RAW",
        resource: {
          values: batch,
        },
      });
    }

    // ------------------------------------------------------------------
    // 6) Response
    // ------------------------------------------------------------------
    res.json({
      success: true,
      totalInFile: lines.length,
      inserted: newRows,
      skipped: skippedRows,
    });

  } catch (err) {
    console.error("uploadPatients error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
