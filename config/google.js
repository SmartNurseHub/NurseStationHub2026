/******************************************************************
 * config/google.js
 ******************************************************************/
const { google } = require("googleapis");

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(
      Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64").toString()
    ),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function appendRow(sheetName, values) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: sheetName,
    valueInputOption: "RAW",
    requestBody: {
      values: [values],
    },
  });

  console.log(`✅ Append to ${sheetName}`, values);
}

module.exports = {
  getAuth,
  appendRow, // 🔥 สำคัญ
};
