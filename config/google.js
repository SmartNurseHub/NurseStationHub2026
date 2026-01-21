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

module.exports = {
  getAuth,
};
