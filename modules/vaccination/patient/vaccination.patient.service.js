const { getSheets } = require("@config/google")
const { getCache,setCache } = require("../core/cache");

async function getPatient(cid){

  const cache = getCache("p_"+cid);
  if(cache) return cache;

  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId:process.env.SPREADSHEET_ID,
    range:"Patients!A2:K"
  });

  const rows = res.data.values||[];

  const r = rows.find(x=>String(x[0])===String(cid));
  if(!r) return null;

  const patient={
    cid:r[0],
    firstName:r[2],
    lastName:r[3],
    lineUID:r[10]
  };

  setCache("p_"+cid,patient,60000);

  return patient;
}

module.exports={ getPatient };