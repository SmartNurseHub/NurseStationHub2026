const { getSheets } = require("@config/google")

async function getVaccinationByVCN(vcn){

  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId:process.env.SPREADSHEET_ID,
    range:"VaccinationRecords!A2:N"
  });

  const rows = res.data.values||[];

  const r = rows.find(x=>x[0]===vcn);
  if(!r) return null;

  return {
    vcn:r[0],
    cid:r[1],
    vaccineCode:r[3]
  };
}

module.exports={ getVaccinationByVCN };