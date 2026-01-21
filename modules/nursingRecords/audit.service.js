exports.log = async ({ nsr, action, user, detail }) => {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `NursingAuditLog!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toISOString(),
        nsr,
        action,
        user,
        detail || ""
      ]]
    }
  });
};
