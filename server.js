/*************************************************
 * server.js — MODULE-BASED VERSION (FIXED)
 *************************************************/

require("dotenv").config();
console.log("ENV TOKEN =", process.env.LINE_CHANNEL_ACCESS_TOKEN);
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   STATIC FILES
================================ */
app.use(express.static(path.join(__dirname, "public")));
app.use("/modules", express.static(path.join(__dirname, "modules")));

/* ===============================
   API ROUTES
================================ */
app.use("/api", require("./routes"));

// ⭐ เพิ่มบรรทัดนี้
app.use(
  "/satisfaction-survey",
  require("./modules/satisfactionSurvey/satisfactionSurvey.routes")
);

app.use("/api", require("./routes"));  // ✅ โหลด routes/index.js
/* ===============================
   SPA FALLBACK
================================ */
app.get(/^\/(?!api|satisfaction-survey).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 NurseStationHub running on port ${PORT}`);
});