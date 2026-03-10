/*************************************************
 * server.js — NurseStationHub (STABLE)
 *************************************************/

require("dotenv").config();

const express = require("express");
const path = require("path");
const cron = require("node-cron");

const { checkAndSendReminders } =
  require("./modules/vaccination/vaccination.reminder.service");

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
app.use("/views", express.static(path.join(__dirname, "views")));

/* ===============================
   API ROUTES
================================ */

app.use("/api", require("./routes"));

app.use(
  "/api/patient",
  require("./modules/patients/patients.routes")
);

app.use(
  "/api/vaccination",
  require("./modules/vaccination/vaccination.routes")
);

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

app.get("*", (req, res) => {

  if (req.path.includes(".")) {
    return res.status(404).end();
  }

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