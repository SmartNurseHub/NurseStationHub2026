/*****************************************************************
 * vaccination.service.js (AUTO SCHEDULE + ADVANCED VERSION)
 *****************************************************************/
const { getSheetClient } = require("../../config/google");
/* =========================================================
   SHEETS
========================================================= */
const SHEET_MASTER = "VaccineMaster";
const SHEET_RECORD = "VaccinationRecords";
const SHEET_APPOINT = "VaccinationAppointments";
const SHEET_PATIENT = "Patients";
const SHEET_SCHEDULE = "Vaccine_Schedule";
const SHEET_REMINDER = "Reminder";
/* =========================================================
   UTIL
========================================================= */

function addDays(date, days) {

  const d = new Date(date);

  if (isNaN(d)) {
    throw new Error("Invalid dateService");
  }

  d.setDate(d.getDate() + Number(days || 0));

  return d;

}

function addMonths(date, months){

  const d = new Date(date);

  if(isNaN(d)){
    throw new Error("Invalid dateService");
  }

  d.setMonth(d.getMonth() + Number(months || 0));

  return d;

}

function calculateDueDate(dateService, intervalType, intervalValue){

  if(intervalType === "months"){
    return addMonths(dateService, intervalValue);
  }

  if(intervalType === "days"){
    return addDays(dateService, intervalValue);
  }

  return addDays(dateService, intervalValue);

}

function toISO(date) {

  const d = new Date(date);

  if (isNaN(d)) return "";

  return d.toISOString().split("T")[0];

}

function calculateAge(birthDate) {

  if (!birthDate) return null;

  const b = new Date(birthDate);
  const t = new Date();

  let age = t.getFullYear() - b.getFullYear();

  const m = t.getMonth() - b.getMonth();

  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) {
    age--;
  }

  return age;

}

/* =========================================================
   GEN VCN
========================================================= */

async function genVCN() {

  const sheets = await getSheetClient();
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

  const running = String(count).padStart(5, "0");

  return `${prefix}-${running}`;

}

/* =========================================================
   GEN APPOINTMENT ID
========================================================= */

async function genAPID() {

  const sheets = await getSheetClient();
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

  const running = String(count).padStart(5, "0");

  return `${prefix}-${running}`;

}

/* =========================================================
   LOAD VACCINE MASTER
========================================================= */

async function getVaccineMaster() {

  const sheets = await getSheetClient();
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

/* =========================================================
   LOAD VACCINE SCHEDULE
========================================================= */

async function getVaccineSchedule(vaccineCode) {

  const sheets = await getSheetClient();
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
  .sort((a,b)=>a.doseNo - b.doseNo);

}

/* =========================================================
   GET PATIENT
========================================================= */

async function getPatient(cid) {

  const sheets = await getSheetClient();
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
        birthDate: r[6] || "",
        age: calculateAge(r[6]),
        telephone: r[8] || "",
        phone: r[9] || r[8] || ""
      };

    }

  }

  return null;

}

/* =========================================================
   LOAD APPOINTMENTS
========================================================= */

async function getAppointmentsByVaccine(cid, vaccineCode){

  const sheets = await getSheetClient();
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
   CREATE APPOINTMENTS
========================================================= */
async function createVaccinationAppointments(patient, vaccineCode, dateService, currentDose) {

  const sheets = await getSheetClient();
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

    reminders.push({
      apid,
      doseNo: s.doseNo,
      due
    });

  }

  if (!rows.length) return;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_APPOINT}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows }
  });

  for(const r of reminders){
    await createReminder(
      patient,
      vaccineCode,
      r.doseNo,
      r.due,
      r.apid
    );
  }

}
/* =========================================================
   GEN REMINDER ID
========================================================= */

async function genREMID() {

  const sheets = await getSheetClient();
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

  const count =
    rows.filter(r => r[0] && r[0].startsWith(prefix)).length + 1;

  const running = String(count).padStart(5, "0");

  return `${prefix}-${running}`;

}

/* =========================================================
   SAVE VACCINATION
========================================================= */

async function saveVaccination(data) {

  const cid = data.cid;
  const vaccineCode = data.vaccineCode;
  const doseNo = Number(data.doseNo);
  const dateService = data.dateService;

  const providerRole = data.providerRole || "";
  const providerName = data.providerName || "";
  const locationType = data.locationType || "";
  const locationDetail = data.locationDetail || "";
  const lotNumber = data.lotNumber || "";

  if (!cid) throw new Error("CID required");
  if (!vaccineCode) throw new Error("vaccineCode required");
  if (!doseNo) throw new Error("doseNo required");
  if (!dateService) throw new Error("dateService required");

  const sheets = await getSheetClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const masterList = await getVaccineMaster();
  const master = masterList.find(v => v.code === vaccineCode);

  if (!master) throw new Error("Vaccine not found");

  const patient = await getPatient(cid);

  if (!patient) throw new Error("Patient not found");

  const vcn = await genVCN();

  const recordRow = [

  vcn,               // VCN
  cid,               // CID
  patient.hn,        // HN
  vaccineCode,       // VaccineCode
  doseNo,            // DoseNo
  dateService,       // DateService
  providerRole,      // ProviderRole
  providerName,      // ProviderName
  locationType,      // LocationType
  locationDetail,    // LocationDetail
  lotNumber,         // LotNumber
  "",                // NextDueDate
  "COMPLETED",       // Status
  new Date().toISOString() // CreatedAt

];

  await sheets.spreadsheets.values.append({
  spreadsheetId,
  range: `${SHEET_RECORD}!A2`,
  valueInputOption: "USER_ENTERED",
  requestBody: { values: [recordRow] }
});

await completeAppointment(
  cid,
  vaccineCode,
  doseNo
);

await createVaccinationAppointments(
  patient,
  vaccineCode,
  dateService,
  doseNo
);

return { success: true };

}

/* =========================================================
   RECORDS
========================================================= */

async function getVaccinationRecords(cid) {

  const sheets = await getSheetClient();
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
   TIMELINE / HISTORY / LATEST
========================================================= */

async function getVaccinationTimeline(cid) {

  const records = await getVaccinationRecords(cid);

  records.sort((a, b) =>
    new Date(a.dateService) - new Date(b.dateService)
  );

  return records;

}

async function getLatestVaccines(cid) {

  const records = await getVaccinationRecords(cid);

  const map = {};

  records.forEach(r => {

    if (!map[r.vaccineCode]) {

      map[r.vaccineCode] = r;

    } else {

      const oldDate = new Date(map[r.vaccineCode].dateService);
      const newDate = new Date(r.dateService);

      if (newDate > oldDate) {
        map[r.vaccineCode] = r;
      }

    }

  });

  return Object.values(map);

}

async function getVaccinationHistory(cid) {

  const records = await getVaccinationRecords(cid);

  records.sort((a, b) =>
    new Date(b.dateService) - new Date(a.dateService)
  );

  return records;

}

/* =========================================================
   NEXT VCN
========================================================= */

async function getNextVCN() {

  const vcn = await genVCN();

  return { vcn };

}



async function getAppointments(cid){

  const sheets = await getSheetClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_APPOINT}!A2:N`
  });

  const rows = res.data.values || [];

  return rows
    .filter(r => r && String(r[1]) === String(cid))   // ⭐ แก้ตรงนี้
    .map(r => ({
      apid: r[0] || "",
      cid: r[1] || "",
      hn: r[2] || "",
      vaccineCode: r[3] || "",
      doseNo: Number(r[4] || 0),
      appointmentDate: r[5] || "",
      status: r[6] || ""
    }))
    .sort((a,b)=>
      new Date(a.appointmentDate) -
      new Date(b.appointmentDate)
    );

}

async function completeAppointment(cid, vaccineCode, doseNo){

  const sheets = await getSheetClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_APPOINT}!A2:N`
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
    range: `${SHEET_APPOINT}!A${rowNumber}:N${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [rows[index]] }
  });

}


/******************************************************************
 DELETE VACCINATION (REAL ROW DELETE)
******************************************************************/

async function deleteVaccination(vcn){

  const sheets = await getSheetClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_RECORD}!A2:A`
  });

  const rows = res.data.values || [];

  const index = rows.findIndex(r => r[0] === vcn);

  if(index === -1){
    throw new Error("Vaccination record not found");
  }

  // แถวจริงใน sheet (A1 header)
  const rowNumber = index + 1; // header
  const startIndex = rowNumber;
  const endIndex = rowNumber + 1;

  const meta = await sheets.spreadsheets.get({
    spreadsheetId
  });

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
              sheetId: sheetId,
              dimension:"ROWS",
              startIndex:startIndex,
              endIndex:endIndex
            }
          }
        }
      ]
    }
  });

  return { success:true };

}
async function createReminder(patient, vaccineCode, doseNo, appointmentDate, apid){

  if(!appointmentDate) return;

  const sheets = await getSheetClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const notify30 = addDays(appointmentDate,-30);
  const notify7  = addDays(appointmentDate,-7);
  const notify1  = addDays(appointmentDate,-1);
  const notify0  = new Date(appointmentDate); // ⭐ วันนัด

  const base = await genREMID()
const rem1 = base + "-1"
const rem2 = base + "-2"
const rem3 = base + "-3"
const rem4 = base + "-4"

  const rows = [

    [
      rem1,
      apid,
      patient.cid,
      patient.hn || "",
      vaccineCode,
      doseNo,
      toISO(appointmentDate),
      toISO(notify30),
      "BEFORE_30_DAY",
      "LINE",
      "PENDING",
      new Date().toISOString()
    ],

    [
      rem2,
      apid,
      patient.cid,
      patient.hn || "",
      vaccineCode,
      doseNo,
      toISO(appointmentDate),
      toISO(notify7),
      "BEFORE_7_DAY",
      "LINE",
      "PENDING",
      new Date().toISOString()
    ],

    [
      rem3,
      apid,
      patient.cid,
      patient.hn || "",
      vaccineCode,
      doseNo,
      toISO(appointmentDate),
      toISO(notify1),
      "BEFORE_1_DAY",
      "LINE",
      "PENDING",
      new Date().toISOString()
    ],

    [
      rem4,
      apid,
      patient.cid,
      patient.hn || "",
      vaccineCode,
      doseNo,
      toISO(appointmentDate),
      toISO(notify0),
      "DAY_OF_APPOINTMENT",
      "LINE",
      "PENDING",
      new Date().toISOString()
    ]

  ];

  if(rows.length){
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_REMINDER}!A2`,
    valueInputOption:"USER_ENTERED",
    requestBody:{ values:rows }
  });

}}
/* =========================================================
   EXPORT
========================================================= */

module.exports = {

  getVaccineMaster,
  getPatient,
  getVaccinationRecords,
  saveVaccination,

  getNextVCN,

  getVaccinationTimeline,
  getLatestVaccines,
  getVaccinationHistory,
  getAppointments,

  deleteVaccination,   // ⭐ ต้องมี

  timeline: getVaccinationTimeline,
  latest: getLatestVaccines,
  history: getVaccinationHistory

};