const { google } = require("googleapis");

function getAuth() {
  if (!process.env.GOOGLE_CREDENTIAL_BASE64) {
    throw new Error("Missing GOOGLE_CREDENTIAL_BASE64");
  }

  // decode base64 → JSON
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64").toString("utf8")
  );

  return new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
}

const sheets = google.sheets({
  version: "v4",
  auth: getAuth(),
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_PATIENTS = process.env.SHEET_PATIENTS || "Patients";

async function getPatients() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_PATIENTS}!A2:C`,
  });

  return (res.data.values || []).map(row => ({
    id: row[0],
    name: row[1],
    age: row[2],
  }));
}

async function addPatient(p) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_PATIENTS}!A:C`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[p.id, p.name, p.age]],
    },
  });
}

module.exports = {
  getPatients,
  addPatient,
};
