/*************************************************
 * server.js — PRODUCTION SAFE (Render OK)
 *************************************************/

require("dotenv").config();
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

/* ===============================
   SPA FALLBACK (❗ ไม่กิน /api)
================================ */
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 NurseStationHub running on port ${PORT}`);
});
