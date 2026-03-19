/*****************************************************************
 REMINDER JOB
*****************************************************************/

/*****************************************************************
 REMINDER JOB (FINAL PRODUCTION VERSION)
 - Flex Message
 - Multi NotifyType (30D / 7D / 1D / DAY)
 - Anti Duplicate
 - Group Status Dashboard
*****************************************************************/

const { getSheets } = require("../config/google");
const line = require("../modules/lineOA/line.service");

const SHEET_REMINDER = "Reminder";
const SHEET_PATIENT = "Patients";
const SHEET_VACCINE = "VaccineMaster";

/*****************************************************************
 UTIL
*****************************************************************/

function todayISO(){
  return new Date().toISOString().split("T")[0];
}

/*****************************************************************
 GET DATA
*****************************************************************/

async function getReminderRows(){

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range:`${SHEET_REMINDER}!A2:L`
  });

  const rows = res.data.values || [];

  return rows.map((r,i)=>({
    rowIndex: i + 2,
    reminderId: r[0],
    vcn: r[1],
    cid: r[2],
    hn: r[3],
    vaccineCode: r[4],
    doseNo: r[5],
    appointmentDate: r[6],
    notifyDate: r[7],
    notifyType: r[8],
    channel: r[9],
    status: r[10],
    createdAt: r[11]
  }));

}

/*****************************************************************
 FILTER TODAY
*****************************************************************/

function getTodayReminders(rows){

  const today = todayISO();

  return rows.filter(r =>
    r.notifyDate === today &&
    r.status === "PENDING"
  );

}

/*****************************************************************
 GET PATIENT
*****************************************************************/

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
    lineUid: String(row[10] || "").trim()
  };
}

/*****************************************************************
 GET VACCINE MASTER
*****************************************************************/

async function getVaccineMaster(){

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range:`${SHEET_VACCINE}!A2:Z`
  });

  const rows = res.data.values || [];

  return rows.map(r => ({
    code: r[0],
    name: r[1],
    TH_Name: r[2],
    totalDose: Number(r[3] || 0)
  }));

}

/*****************************************************************
 FLEX TITLE (ตามช่วงเวลา)
*****************************************************************/

function getReminderTitle(type){

  if(type === "BEFORE_30_DAY") return "📅 แจ้งเตือนล่วงหน้า 30 วัน";
  if(type === "BEFORE_7_DAY")  return "⏰ แจ้งเตือนล่วงหน้า 7 วัน";
  if(type === "BEFORE_1_DAY")  return "🚨 แจ้งเตือนก่อน 1 วัน";
  if(type === "DAY_OF_APPOINTMENT") return "📢 วันนี้มีนัดฉีดวัคซีน";

  return "📢 แจ้งเตือนวัคซีน";
}

/*****************************************************************
 BUILD FLEX
*****************************************************************/

function buildReminderFlex(data, patient, vaccine){

  const title = getReminderTitle(data.notifyType);

  const vaccineNameTH = vaccine?.TH_Name || data.vaccineCode;
  const vaccineNameEN = vaccine?.name || "";
  const totalDose = vaccine?.totalDose || "-";

  return {
    type: "flex",
    altText: "แจ้งเตือนวัคซีน",
    contents: {
      type: "bubble",
      size: "mega",

      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        contents: [

          { type: "text", text: title, weight:"bold", size:"xl", align:"center" },

          { type: "text", text: patient.name, align:"center", weight:"bold" },

          { type:"separator" },

          { type:"text", text:`${vaccineNameTH}`, weight:"bold" },
          { type:"text", text:`(${vaccineNameEN})`, size:"xs" },

          { type:"text", text:`เข็มที่ ${data.doseNo} / ${totalDose}` },

          { type:"separator" },

          { type:"text", text:`📅 ${data.appointmentDate}`, weight:"bold" },

          { type:"separator" },

          {
            type:"text",
            text:"กรุณามารับบริการตามวันนัด",
            size:"sm"
          }

        ]
      }
    }
  };
}

/*****************************************************************
 UPDATE STATUS
*****************************************************************/

async function updateReminderStatus(rowIndex, status){

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

/*****************************************************************
 LINE RETRY
*****************************************************************/

async function pushLineRetry(userId, message, retry=3){

  try{
    await line.client.pushMessage(userId, message);
  }catch(err){

    if(retry > 0){
      console.log("Retry...", retry);
      await new Promise(r => setTimeout(r, 1000));
      return pushLineRetry(userId, message, retry-1);
    }

    throw err;
  }
}

/*****************************************************************
 GROUP STATUS (ใช้ทำ dashboard)
*****************************************************************/

function groupReminderStatus(rows){

  const map = {};

  for(const r of rows){

    const key = `${r.vcn}_${r.doseNo}`;

    if(!map[key]){
      map[key] = {
        vcn: r.vcn,
        doseNo: r.doseNo,
        vaccineCode: r.vaccineCode,
        status30: "NO",
        status7: "NO",
        status1: "NO",
        statusDay: "NO"
      };
    }

    if(r.notifyType === "BEFORE_30_DAY" && r.status === "SENT"){
      map[key].status30 = "YES";
    }

    if(r.notifyType === "BEFORE_7_DAY" && r.status === "SENT"){
      map[key].status7 = "YES";
    }

    if(r.notifyType === "BEFORE_1_DAY" && r.status === "SENT"){
      map[key].status1 = "YES";
    }

    if(r.notifyType === "DAY_OF_APPOINTMENT" && r.status === "SENT"){
      map[key].statusDay = "YES";
    }

  }

  return Object.values(map);
}

/*****************************************************************
 MAIN JOB
*****************************************************************/

async function runReminderJob(){

  console.log("🚀 REMINDER JOB START");

  const rows = await getReminderRows();
  const reminders = getTodayReminders(rows);
  const vaccines = await getVaccineMaster();

  console.log("📊 Today:", reminders.length);

  for(const r of reminders){

    try{

      // 🔥 กันยิงซ้ำ
      if(r.status === "SENT"){
        console.log("⏭️ Skip:", r.reminderId);
        continue;
      }

      const patient = await getPatientLineUID(r.cid);

      if(!patient || !patient.lineUid){

        await updateReminderStatus(r.rowIndex,"FAILED");
        continue;
      }

      const vaccine = vaccines.find(v =>
        String(v.code).toUpperCase() ===
        String(r.vaccineCode).toUpperCase()
      );

      const flex = buildReminderFlex(r, patient, vaccine);

      await pushLineRetry(patient.lineUid, flex);

      await updateReminderStatus(r.rowIndex,"SENT");

      console.log("✅ Sent:", r.reminderId);

    }
    catch(err){

      console.error("🔥 ERROR:", err.message);

      await updateReminderStatus(r.rowIndex,"FAILED");

    }

  }

  console.log("🏁 DONE");

}

/*****************************************************************
 EXPORT
*****************************************************************/

module.exports = {
  runReminderJob,
  getReminderRows,
  groupReminderStatus
};