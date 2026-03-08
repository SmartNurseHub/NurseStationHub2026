/*************************************************
 * server.js — MODULE-BASED VERSION (FIXED)
 *************************************************/

require("dotenv").config();

const express = require("express");
const path = require("path");
const cron = require("node-cron");

const { checkAndSendReminders } = require("./modules/vaccination/vaccination.reminder.service");

const app = express();
const PORT = process.env.PORT || 3000;


/* ===============================
   MIDDLEWARE
================================ */

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));


/* ===============================
   STATIC FILES
================================ */

app.use(express.static(path.join(__dirname, "public")));
app.use("/modules", express.static(path.join(__dirname, "modules")));


/* ===============================
   API ROUTES
================================ */

app.use("/api", require("./routes"));

/* ✅ PATIENT MODULE */
app.use(
  "/api/patient",
  require("./modules/patients/patients.routes")
);

/* ✅ VACCINATION MODULE (แก้ตรงนี้) */
app.use(
  "/api/vaccination",
  require("./modules/vaccination/vaccination.routes")
);

/* SATISFACTION SURVEY */
app.use(
  "/satisfaction-survey",
  require("./modules/satisfactionSurvey/satisfactionSurvey.routes")
);


/* ===============================
   CRON JOB — Vaccination Reminder
================================ */

cron.schedule("0 8 * * *", async () => {

  console.log("🔔 Vaccination reminder job started");

  try {

    await checkAndSendReminders();

    console.log("✅ Reminder job completed");

  } catch (err) {

    console.error("❌ Reminder job error:", err);

  }

});


/* ===============================
   SPA FALLBACK
================================ */

app.get(/^\/(?!api|satisfaction-survey).*/, (req, res) => {

  res.sendFile(
    path.join(__dirname, "views/index.html")
  );

});


/* ===============================
   START SERVER
================================ */

app.listen(PORT, () => {

  console.log(`🚀 NurseStationHub running on port ${PORT}`);

});