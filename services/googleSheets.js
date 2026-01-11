const { google } = require("googleapis");

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function getPatients() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "patients!A2:C",
  });

  return res.data.values?.map(row => ({
    id: row[0],
    name: row[1],
    age: row[2],
  })) || [];
}

async function addPatient(patient) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "patients!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[patient.id, patient.name, patient.age]],
    },
  });
}

module.exports = {
  getPatients,
  addPatient,
};
