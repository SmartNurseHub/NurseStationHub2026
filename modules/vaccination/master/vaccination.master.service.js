const { getSheets } = require("@config/google")
const { setCache, getCache } = require("../core/cache");

const SHEET_MASTER="VaccineMaster";

async function getVaccineMaster(){

  const cache = getCache("vaccine_master");
  if(cache) return cache;

  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId:process.env.SPREADSHEET_ID,
    range:`${SHEET_MASTER}!A2:F`
  });

  const rows = res.data.values||[];

  const data = rows.map(r=>({
    code:r[0],
    name:r[1],
    totalDose:Number(r[2]||0),
    TH_Name:r[5]||r[1]
  }));

  setCache("vaccine_master",data,300000);
  return data;
}

module.exports={ getVaccineMaster };