const { getSheets } = require("@config/google")

async function getAppointments(cid){

  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId:process.env.SPREADSHEET_ID,
    range:"VaccinationAppointments!A2:N"
  });

  const rows = res.data.values||[];

  return rows.filter(r=>String(r[1])===String(cid));
}

module.exports={ getAppointments };