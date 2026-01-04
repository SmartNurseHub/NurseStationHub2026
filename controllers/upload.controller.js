const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS || "Patients";
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64").toString()
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

const BATCH_SIZE = 1000; // 50k แถว → 50 batches

exports.uploadPatients = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    console.log("Upload file received:", req.file.originalname, "size:", req.file.size);

    const sheets = await getSheets();

    // อ่านไฟล์เป็น text
    const content = req.file.buffer.toString("utf-8");
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    console.log("Total lines in file:", lines.length);

    // โหลดข้อมูลเดิมจาก Sheet
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_PATIENTS}!A:A`,
    });
    const existingRows = sheetData.data.values?.flat() || [];
    console.log("Existing rows in Sheet:", existingRows.length);

    let newRows = 0;
    let updatedRows = 0;
    const toAppend = [];

    // แยก newRows vs updatedRows
    lines.forEach(line => {
      if (!existingRows.includes(line)) {
        toAppend.push([line]);
        newRows++;
      } else {
        updatedRows++;
      }
    });

    console.log(`New rows: ${newRows}, Updated rows: ${updatedRows}`);

    // Append แบบ batch
    for (let i = 0; i < toAppend.length; i += BATCH_SIZE) {
      const batch = toAppend.slice(i, i + BATCH_SIZE);
      console.log(`Appending batch rows ${i + 1} - ${i + batch.length}...`);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_PATIENTS,
        valueInputOption: "RAW",
        resource: { values: batch },
      });

      // ส่ง progress กลับ frontend แบบ chunked
      if (res.writableEnded) break; // ตรวจสอบ connection
    }

    console.log("Upload completed successfully");
    res.json({
      success: true,
      totalInFile: lines.length,
      processed: lines.length,
      newRows,
      updatedRows,
    });

  } catch (err) {
    console.error("UploadPatients exception:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
