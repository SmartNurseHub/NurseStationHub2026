/*****************************************************************
 REMINDER JOB
*****************************************************************/

const { getSheets } = require("../config/google");
const line = require("../modules/lineOA/line.service");

const SHEET_REMINDER = "Reminder";
const SHEET_PATIENT = "Patients";

function todayISO(){

  const d = new Date();
  return d.toISOString().split("T")[0];

}

async function getTodayReminders(){

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range:`${SHEET_REMINDER}!A2:L`
  });

  const rows = res.data.values || [];

  const today = todayISO();

  return rows
    .map((r,i)=>({

      rowIndex: i + 2,
      reminderId: r[0],
      apid: r[1],
      cid: r[2],
      hn: r[3],
      vaccineCode: r[4],
      doseNo: r[5],
      appointmentDate: r[6],
      notifyDate: r[7],
      notifyType: r[8],
      channel: r[9],
      status: r[10]

    }))
    .filter(r =>
      r.notifyDate === today &&
      r.status === "PENDING"
    );

}

async function getPatientLineUID(cid){

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range:`${SHEET_PATIENT}!A2:Z`
  });

  const rows = res.data.values || [];

  const row = rows.find(r => r[0] === cid);

  if(!row) return null;

  return {

    name: `${row[1] || ""}${row[2] || ""} ${row[3] || ""}`,
    lineUid: row[10] || ""

  };

}

function buildMessage(data, patient){

return `💉 แจ้งเตือนนัดฉีดวัคซีน

ชื่อ: ${patient.name}

วัคซีน: ${data.vaccineCode}
เข็มที่: ${data.doseNo}

📅 วันนัด: ${data.appointmentDate}

กรุณามารับบริการตามวันนัด
หากไม่สะดวก กรุณาติดต่อเจ้าหน้าที่`;

}

async function updateReminderStatus(rowIndex,status){

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  await sheets.spreadsheets.values.update({

    spreadsheetId,
    range:`${SHEET_REMINDER}!K${rowIndex}`,
    valueInputOption:"USER_ENTERED",
    requestBody:{
      values:[[status]]
    }

  });

}

async function runReminderJob(){

  console.log("REMINDER JOB START");

  const reminders = await getTodayReminders();

  console.log("Today reminders:", reminders.length);

  for(const r of reminders){

    try{

      const patient = await getPatientLineUID(r.cid);

      if(!patient || !patient.lineUid){

        await updateReminderStatus(r.rowIndex,"FAILED");
        continue;

      }

      const msg = buildMessage(r,patient);

      await line.pushVaccineReminder({

        userId: patient.lineUid,
        fullName: patient.name,
        vaccineCode: r.vaccineCode,
        doseNo: r.doseNo,
        appointmentDate: r.appointmentDate,
        notifyType: r.notifyType

        });

      await updateReminderStatus(r.rowIndex,"SENT");

      console.log("Sent:",r.reminderId);

    }
    catch(err){

      console.error(err);

      await updateReminderStatus(r.rowIndex,"FAILED");

    }

  }

}

module.exports = { runReminderJob };