const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS || "Patients";
const BATCH_SIZE = 1000;

// ---------------------------------------------------------------------
// Google Auth
// ---------------------------------------------------------------------
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64")
    .toString("utf-8")
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

    console.log("Upload file:", req.file.originalname, req.file.size);

    const sheets = await getSheets();

    // -----------------------------------------------------------------
    // 1) Read file
    // -----------------------------------------------------------------
    const content = req.file.buffer.toString("utf-8");
    const rawLines = content.split(/\r?\n/).filter(l => l.trim());

    if (rawLines.length < 2) {
      return res.status(400).json({
        success: false,
        message: "File has no data rows",
      });
    }

    // -----------------------------------------------------------------
    // 2) Find REAL header (pipe-delimited)
    // -----------------------------------------------------------------
    const headerIndex = rawLines.findIndex(l => l.includes("|"));
    if (headerIndex === -1) {
      throw new Error("Pipe-delimited header not found");
    }

    const headerLine = rawLines[headerIndex];
    const headers = headerLine.split("|");
    const dataLines = rawLines.slice(headerIndex + 1);

    console.log("Columns:", headers.length);
    console.log("Data rows:", dataLines.length);

    // -----------------------------------------------------------------
    // 3) Use CID as KEY (HDC standard)
    // -----------------------------------------------------------------
    const KEY_NAME = "CID";
    const keyColIndex = headers.indexOf(KEY_NAME);
    if (keyColIndex === -1) {
      throw new Error(`${KEY_NAME} column not found`);
    }

    const keyColLetter = String.fromCharCode(65 + keyColIndex);

    // -----------------------------------------------------------------
    // 4) Load existing CID from Sheet
    // -----------------------------------------------------------------
    const sheetKey = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!${keyColLetter}:${keyColLetter}`,
    });

    const existingKeySet = new Set(
      (sheetKey.data.values || []).flat().filter(Boolean)
    );

    console.log("Existing CID:", existingKeySet.size);

    // -----------------------------------------------------------------
    // 5) Insert header if sheet empty
    // -----------------------------------------------------------------
    if (existingKeySet.size === 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_PATIENTS,
        valueInputOption: "RAW",
        resource: { values: [headers] },
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
      const values = line.split("|");
      const row = headers.map((_, i) => values[i] ?? "");

      const cid = row[keyColIndex];

      // CID validation
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

    console.log(`Inserted: ${inserted}, Skipped: ${skipped}`);

    // -----------------------------------------------------------------
    // 7) Batch append
    // -----------------------------------------------------------------
    for (let i = 0; i < toAppend.length; i += BATCH_SIZE) {
      const batch = toAppend.slice(i, i + BATCH_SIZE);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_PATIENTS,
        valueInputOption: "RAW",
        resource: { values: batch },
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
