require("dotenv").config();
const { google } = require("googleapis");
const { getAuth } = require("../helpers/googleAuth");

async function main() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  console.log("👤 Auth as:", auth.email);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.TEST_SPREADSHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [["OK", new Date().toISOString()]]
    }
  });

  console.log("✅ WRITE SUCCESS");
}

main().catch(err => {
  console.error("❌ FAILED");
  console.error(err.message);
});
