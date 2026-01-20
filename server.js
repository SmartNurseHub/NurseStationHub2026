/*************************************************
 * server.js — MODULE-BASED VERSION (FIXED)
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

/* 🔥 สำคัญมาก: เปิด modules ให้ frontend */
app.use("/modules", express.static(path.join(__dirname, "modules")));

/* ===============================
   API ROUTES
================================ */
const apiRoutes = require("./routes");
app.use("/api", apiRoutes);

/* ===============================
   SPA FALLBACK
================================ */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 NurseStationHub running at http://localhost:${PORT}`);
});
