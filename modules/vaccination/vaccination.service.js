/*****************************************************************
 * vaccination.service.js (STABLE VERSION)
 *****************************************************************/

const { getSheets } = require("../../config/google");

/* =========================================================
   SHEETS
========================================================= */

const SHEET_MASTER = "VaccineMaster";
const SHEET_RECORD = "VaccinationRecords";
const SHEET_APPOINT = "VaccinationAppointments";
const SHEET_PATIENT = "Patients";

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
   GEN VCN FORMAT
   VCNYYYYMM-00001
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

  const running = String(count).padStart(5, "0");

  return `${prefix}-${running}`;

}

/* =========================================================
   GET NEXT VCN (FOR FORM DISPLAY)
========================================================= */

async function getNextVCN() {

  const vcn = await genVCN();

  return {
    vcn
  };

}

/* =========================================================
   LOAD VACCINE MASTER
========================================================= */

async function getVaccineMaster() {

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_MASTER}!A2:I`
  });

  const rows = res.data.values || [];

  return rows.map(r => ({

    code: r[0],
    name: r[1],
    totalDose: Number(r[2] || 0),
    intervalDays: Number(r[3] || 0),
    minIntervalDays: Number(r[4] || 0),
    allowBooster: r[5] === "TRUE",
    ageMinMonths: Number(r[6] || 0),
    ageMaxMonths: Number(r[7] || 0),
    active: r[8] === "TRUE"

  }));

}

/* =========================================================
   GET PATIENT
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
   GET VACCINATION RECORDS
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
    .filter(r => r[1] === cid)
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
   CALCULATE NEXT DOSE
========================================================= */

function calculateNextDose(master, doseNo) {

  if (!master) return null;

  if (doseNo >= master.totalDose) {

    if (master.allowBooster) {
      return doseNo + 1;
    }

    return null;

  }

  return doseNo + 1;

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

  /* ---------------- VALIDATION ---------------- */

  if (!cid) throw new Error("CID required");
  if (!vaccineCode) throw new Error("vaccineCode required");
  if (!doseNo) throw new Error("doseNo required");
  if (!dateService) throw new Error("dateService required");

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  /* ---------------- LOAD MASTER ---------------- */

  const masterList = await getVaccineMaster();
  const master = masterList.find(v => v.code === vaccineCode);

  if (!master) {
    throw new Error("Vaccine not found");
  }

  /* ---------------- LOAD PATIENT ---------------- */

  const patient = await getPatient(cid);

  if (!patient) {
    throw new Error("Patient not found");
  }

  /* ---------------- CALCULATE NEXT DOSE ---------------- */

  const nextDose = calculateNextDose(master, doseNo);

  let nextDue = null;

  if (nextDose && master.intervalDays) {
    nextDue = addDays(dateService, master.intervalDays);
  }

  const vcn = await genVCN();

  /* ======================================================
     SAVE RECORD
  ====================================================== */

  const recordRow = [

    vcn,
    cid,
    patient.hn,
    vaccineCode,
    doseNo,
    dateService,
    providerRole,
    providerName,
    locationType,
    locationDetail,
    lotNumber,
    nextDue ? toISO(nextDue) : "",
    "COMPLETED",
    new Date().toISOString()

  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_RECORD}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [recordRow] }
  });

  /* ======================================================
     CREATE NEXT APPOINTMENT
  ====================================================== */

  if (nextDose && nextDue) {

    const appointRow = [

      vcn,
      cid,
      patient.hn,
      vaccineCode,
      nextDose,
      "",
      "",
      "",
      "",
      "",
      "",
      toISO(nextDue),
      "PENDING",
      new Date().toISOString()

    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_APPOINT}!A2`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [appointRow] }
    });

  }

  return {
    success: true,
    nextDose,
    nextDue: nextDue ? toISO(nextDue) : null
  };

}

/* =========================================================
   TIMELINE
========================================================= */

async function getVaccinationTimeline(cid) {

  const records = await getVaccinationRecords(cid);

  records.sort((a, b) => {
    return new Date(a.dateService) - new Date(b.dateService);
  });

  return records;

}

/* =====================================================
   LATEST VACCINES
===================================================== */
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

/* =====================================================
   VACCINATION HISTORY
===================================================== */

async function getVaccinationHistory(cid) {

  const records = await getVaccinationRecords(cid);

  records.sort((a, b) => {
    return new Date(b.dateService) - new Date(a.dateService);
  });

  return records;

}

/* =========================================================
   GET NEXT VCN
========================================================= */

async function getNextVCN() {

  const vcn = await genVCN();

  return {
    vcn
  };

}


exports.getLatest = async () => {

  const rows = await sheet.getRows("VaccinationRecords");

  if (!rows.length) return null;

  return rows[rows.length - 1];

};
async function loadLatestPreview(){

  try{

    const res = await fetch("/api/vaccination/latest");
    const json = await res.json();

    const box = document.getElementById("latestVaccinePreview");

    if(!json.data){
      box.innerHTML = "ยังไม่มีข้อมูล";
      return;
    }

    const v = json.data;

    box.innerHTML = `
      <div>
        <b>VCN:</b> ${v.vcn}<br>
        <b>Patient:</b> ${v.patient_name}<br>
        <b>Vaccine:</b> ${v.vaccine_code}<br>
        <b>Dose:</b> ${v.dose}<br>
        <b>Date:</b> ${v.date}
      </div>
    `;

  }catch(err){
    console.error("preview error",err);
  }

}
/* =========================================================
   EXPORT
========================================================= */

module.exports = {

  getVaccineMaster,
  getPatient,
  getVaccinationRecords,
  saveVaccination,
  getVaccinationTimeline,

  getLatestVaccines,
  getVaccinationHistory,

  getNextVCN,

};