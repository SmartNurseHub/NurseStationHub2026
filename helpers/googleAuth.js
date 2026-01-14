const { google } = require("googleapis");

function getAuth() {
  if (!process.env.GOOGLE_CREDENTIAL_BASE64) {
    throw new Error("GOOGLE_CREDENTIAL_BASE64 is missing");
  }

  const credentials = JSON.parse(
    Buffer.from(
      process.env.GOOGLE_CREDENTIAL_BASE64,
      "base64"
    ).toString("utf8")
  );

  // 🔴 สำคัญมาก: แปลง newline ใน private_key
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  return new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    [
      // ✅ เขียน / อ่าน Spreadsheet
      "https://www.googleapis.com/auth/spreadsheets",

      // ✅ จำเป็นมากสำหรับ CREATE spreadsheet (Drive file)
      "https://www.googleapis.com/auth/drive.file"
      // หรือถ้าต้องการเต็ม:
      // "https://www.googleapis.com/auth/drive"
    ]
  );
}

module.exports = { getAuth };
