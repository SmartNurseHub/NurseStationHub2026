/*****************************************************************
 * vaccination.service.js
 * AUTO VACCINATION SCHEDULING SYSTEM
 *****************************************************************/

/* =========================================================
   1️⃣ IMPORT
========================================================= */

const { getSheets } = require("../../config/google");


/* =========================================================
   2️⃣ SHEET CONSTANT
========================================================= */

const SHEET_MASTER = "VaccineMaster";
const SHEET_RECORD = "VaccinationRecords";
const SHEET_APPOINT = "VaccinationAppointments";
const SHEET_PATIENT = "Patients";
const SHEET_SCHEDULE = "Vaccine_Schedule";
const SHEET_REMINDER = "Reminder";


/* =========================================================
   3️⃣ UTIL FUNCTIONS
========================================================= */

function addDays(date, days) {
  const d = new Date(date);
  if (isNaN(d)) throw new Error("Invalid dateService");
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  if (isNaN(d)) throw new Error("Invalid dateService");
  d.setMonth(d.getMonth() + Number(months || 0));
  return d;
}

function calculateDueDate(dateService, intervalType, intervalValue) {
  if (intervalType === "months") return addMonths(dateService, intervalValue);
  return addDays(dateService, intervalValue);
}

function toISO(date) {
  const d = new Date(date);
  if (isNaN(d)) return "";
  return d.toISOString().split("T")[0];
}

function calculateAge(birth) {

  if (!birth) return "-";

  if (typeof birth === "string" && birth.length === 6) {
    const d = birth.substring(0, 2);
    const m = birth.substring(2, 4);
    const y = Number(birth.substring(4, 6)) + 2500 - 543;
    birth = `${y}-${m}-${d}`;
  }

  const b = new Date(birth);
  const t = new Date();

  let age = t.getFullYear() - b.getFullYear();

  if (
    t.getMonth() < b.getMonth() ||
    (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())
  ) {
    age--;
  }

  return age;
}


/* =========================================================
   4️⃣ ID GENERATORS
========================================================= */

async function genVCN() {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");

  const prefix = `VCN${y}${m}`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_RECORD}!A2:A`
  });

  const rows = res.data.values || [];

  const count = rows.filter(r => r[0] && r[0].startsWith(prefix)).length + 1;

  return `${prefix}-${String(count).padStart(5, "0")}`;
}

async function genAPID() {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");

  const prefix = `VAP${y}${m}`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_APPOINT}!A2:A`
  });

  const rows = res.data.values || [];

  const count = rows.filter(r => r[0] && r[0].startsWith(prefix)).length + 1;

  return `${prefix}-${String(count).padStart(5, "0")}`;
}

async function genREMID() {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");

  const prefix = `REM${y}${m}`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_REMINDER}!A2:A`
  });

  const rows = res.data.values || [];

  const count = rows.filter(r => r[0] && r[0].startsWith(prefix)).length + 1;

  return `${prefix}-${String(count).padStart(5, "0")}`;
}

/* =========================================================
   GET NEXT VCN
========================================================= */

async function getNextVCN(){

  const vcn = await genVCN();

  return { vcn };

}
/* =========================================================
   5️⃣ MASTER DATA
========================================================= */

async function getVaccineMaster() {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_MASTER}!A2:E`
  });

  const rows = res.data.values || [];

  return rows.map(r => ({
    code: r[0],
    name: r[1],
    totalDose: Number(r[2] || 0),
    allowBooster: r[3] === "TRUE",
    active: r[4] === "TRUE"
  }));
}

async function getVaccineSchedule(vaccineCode) {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_SCHEDULE}!A2:D`
  });

  const rows = res.data.values || [];

  return rows
    .filter(r => r[0] === vaccineCode)
    .map(r => ({
      vaccineCode: r[0],
      doseNo: Number(r[1] || 0),
      intervalType: r[2] || "days",
      intervalValue: Number(r[3] || 0)
    }))
    .sort((a, b) => a.doseNo - b.doseNo);
}


/* =========================================================
   6️⃣ PATIENT DATA
========================================================= */

async function getPatient(cid) {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_PATIENT}!A2:J`
  });

  const rows = res.data.values || [];

  for (let r of rows) {

    if (r[0] === cid) {

      return {
        cid: r[0],
        prename: r[1] || "",
        firstName: r[2] || "",
        lastName: r[3] || "",
        hn: r[4] || "",
        sex: r[5] || "",
        birthDate: r[7] || r[6],
        age: calculateAge(r[7] || r[6]),
        telephone: r[8] || "",
        phone: r[9] || r[8] || ""
      };

    }

  }

  return null;

}


/* =========================================================
   7️⃣ APPOINTMENT QUERY
========================================================= */

async function getAppointmentsByVaccine(cid, vaccineCode) {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_APPOINT}!A2:N`
  });

  const rows = res.data.values || [];

  return rows.filter(r =>
    r[1] === cid &&
    r[3] === vaccineCode
  );

}


/* =========================================================
   8️⃣ REMINDER SYSTEM
========================================================= */

async function createReminder(patient, vaccineCode, doseNo, appointmentDate, apid) {

  if (!appointmentDate) return;

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const notify30 = addDays(appointmentDate, -30);
  const notify7 = addDays(appointmentDate, -7);
  const notify1 = addDays(appointmentDate, -1);
  const notify0 = new Date(appointmentDate);

  const base = await genREMID();

  const rows = [
    [base+"-1", apid, patient.cid, patient.hn || "", vaccineCode, doseNo, toISO(appointmentDate), toISO(notify30),"BEFORE_30_DAY","LINE","PENDING",new Date().toISOString()],
    [base+"-2", apid, patient.cid, patient.hn || "", vaccineCode, doseNo, toISO(appointmentDate), toISO(notify7),"BEFORE_7_DAY","LINE","PENDING",new Date().toISOString()],
    [base+"-3", apid, patient.cid, patient.hn || "", vaccineCode, doseNo, toISO(appointmentDate), toISO(notify1),"BEFORE_1_DAY","LINE","PENDING",new Date().toISOString()],
    [base+"-4", apid, patient.cid, patient.hn || "", vaccineCode, doseNo, toISO(appointmentDate), toISO(notify0),"DAY_OF_APPOINTMENT","LINE","PENDING",new Date().toISOString()]
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_REMINDER}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows }
  });

}


/* =========================================================
   9️⃣ CREATE APPOINTMENTS
========================================================= */

async function createVaccinationAppointments(patient, vaccineCode, dateService, currentDose) {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const schedule = await getVaccineSchedule(vaccineCode);
  if (!schedule.length) return;

  const exists = await getAppointmentsByVaccine(patient.cid, vaccineCode);

  const rows = [];
  const reminders = [];

  for (const s of schedule) {

    if (s.doseNo <= currentDose) continue;
    if (exists.some(e => Number(e[4]) === s.doseNo)) continue;

    const apid = await genAPID();
    const due = calculateDueDate(dateService, s.intervalType, s.intervalValue);

    rows.push([
      apid,
      patient.cid,
      patient.hn || "",
      vaccineCode,
      s.doseNo,
      toISO(due),
      "PENDING",
      new Date().toISOString(),
      ""
    ]);

    reminders.push({ apid, doseNo: s.doseNo, due });

  }

  if (!rows.length) return;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_APPOINT}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows }
  });

  for (const r of reminders) {
    await createReminder(patient, vaccineCode, r.doseNo, r.due, r.apid);
  }

}


/* =========================================================
   🔟 SAVE VACCINATION
========================================================= */

async function saveVaccination(data) {

  const { cid, vaccineCode, doseNo, dateService } = data;

  if (!cid) throw new Error("CID required");
  if (!vaccineCode) throw new Error("vaccineCode required");
  if (!doseNo) throw new Error("doseNo required");
  if (!dateService) throw new Error("dateService required");

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const patient = await getPatient(cid);
  if (!patient) throw new Error("Patient not found");

  const vcn = await genVCN();

  const recordRow = [
    vcn,
    cid,
    patient.hn,
    vaccineCode,
    doseNo,
    dateService,
    data.providerRole || "",
    data.providerName || "",
    data.locationType || "",
    data.locationDetail || "",
    data.lotNumber || "",
    "",
    "COMPLETED",
    new Date().toISOString()
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_RECORD}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [recordRow] }
  });

  await completeAppointment(cid, vaccineCode, doseNo);

  await createVaccinationAppointments(patient, vaccineCode, dateService, doseNo);

  return { success: true };
}


/* =========================================================
   11 RECORD QUERY
========================================================= */

async function getVaccinationRecords(cid) {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_RECORD}!A2:N`
  });

  const rows = res.data.values || [];

  return rows
    .filter(r => String(r[1]) === String(cid))
    .map(r => ({
      vcn: r[0],
      cid: r[1],
      hn: r[2],
      vaccineCode: r[3],
      doseNo: Number(r[4] || 0),
      dateService: r[5],
      providerRole: r[6],
      providerName: r[7],
      locationType: r[8],
      locationDetail: r[9],
      lotNumber: r[10],
      nextDueDate: r[11],
      status: r[12],
      createdAt: r[13]
    }));

}


/* =========================================================
   12 TIMELINE / HISTORY
========================================================= */

async function getVaccinationTimeline(cid) {
  const records = await getVaccinationRecords(cid);
  records.sort((a,b)=>new Date(a.dateService)-new Date(b.dateService));
  return records;
}

async function getLatestVaccines(cid) {

  const records = await getVaccinationRecords(cid);
  const map = {};

  records.forEach(r => {
    if(!map[r.vaccineCode]){
      map[r.vaccineCode] = r;
    }else{
      if(new Date(r.dateService) > new Date(map[r.vaccineCode].dateService)){
        map[r.vaccineCode] = r;
      }
    }
  });

  return Object.values(map);
}

async function getVaccinationHistory(cid) {
  const records = await getVaccinationRecords(cid);
  records.sort((a,b)=>new Date(b.dateService)-new Date(a.dateService));
  return records;
}


/* =========================================================
   13 APPOINTMENT MANAGEMENT
========================================================= */

async function getAppointments(cid){

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_APPOINT}!A2:N`
  });

  const rows = res.data.values || [];

  return rows
    .filter(r => String(r[1]) === String(cid))
    .map(r => ({
      apid:r[0],
      cid:r[1],
      hn:r[2],
      vaccineCode:r[3],
      doseNo:Number(r[4]||0),
      appointmentDate:r[5],
      status:r[6]
    }))
    .sort((a,b)=>new Date(a.appointmentDate)-new Date(b.appointmentDate));

}

async function completeAppointment(cid, vaccineCode, doseNo){

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range:`${SHEET_APPOINT}!A2:N`
  });

  const rows = res.data.values || [];

  const index = rows.findIndex(r =>
    r[1] === cid &&
    r[3] === vaccineCode &&
    Number(r[4]) === Number(doseNo) &&
    r[6] === "PENDING"
  );

  if(index === -1) return;

  rows[index][6] = "DONE";
  rows[index][8] = new Date().toISOString();

  const rowNumber = index + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range:`${SHEET_APPOINT}!A${rowNumber}:N${rowNumber}`,
    valueInputOption:"USER_ENTERED",
    requestBody:{ values:[rows[index]] }
  });

}


/* =========================================================
   14 DELETE RECORD
========================================================= */

async function deleteVaccination(vcn){

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range:`${SHEET_RECORD}!A2:A`
  });

  const rows = res.data.values || [];

  const index = rows.findIndex(r => r[0] === vcn);

  if(index === -1){
    throw new Error("Vaccination record not found");
  }

  const startIndex = index + 1;
  const endIndex = startIndex + 1;

  const meta = await sheets.spreadsheets.get({ spreadsheetId });

  const sheet = meta.data.sheets.find(
    s => s.properties.title === SHEET_RECORD
  );

  const sheetId = sheet.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody:{
      requests:[
        {
          deleteDimension:{
            range:{
              sheetId,
              dimension:"ROWS",
              startIndex,
              endIndex
            }
          }
        }
      ]
    }
  });

  return { success:true };

}


/* =========================================================
   15 EXPORT
========================================================= */

module.exports = {

  getVaccineMaster,
  getPatient,
  saveVaccination,

  getNextVCN,   // ⭐ เพิ่มบรรทัดนี้


  getVaccinationRecords,

  getVaccinationTimeline,
  getLatestVaccines,
  getVaccinationHistory,

  getAppointments,

  deleteVaccination,

  timeline:getVaccinationTimeline,
  latest:getLatestVaccines,
  history:getVaccinationHistory

};