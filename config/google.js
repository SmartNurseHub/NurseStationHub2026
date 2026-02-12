/******************************************************************
 * config/google.js  (RENDER / PRODUCTION SAFE)
 ******************************************************************/
const { google } = require("googleapis");

function getAuth() {
  if (!process.env.GOOGLE_CREDENTIAL_BASE64) {
    throw new Error("❌ GOOGLE_CREDENTIAL_BASE64 is missing");
  }

  const base64 = process.env.GOOGLE_CREDENTIAL_BASE64
    .replace(/\n/g, "")
    .replace(/\r/g, "");

  const credentials = JSON.parse(
    Buffer.from(base64, "base64").toString("utf8")
  );

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function appendRow(sheetName, values) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "RAW",
    requestBody: {
      values: [values],
    },
  });

  console.log(`✅ Append to ${sheetName}`, values);
}

async function readRows(sheetName) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });

  return res.data.values || [];
}

module.exports = {
  getAuth,
  appendRow,
  readRows,
};
