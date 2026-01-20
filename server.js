/*************************************************
<<<<<<< HEAD
 * server.js — MODULE-BASED VERSION (FIXED)
=======
 * server.js — FIXED VERSION
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
 *************************************************/

require("dotenv").config();
const express = require("express");
const path = require("path");
<<<<<<< HEAD
=======

const patientsRoutes = require("./routes/patients.routes");
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
<<<<<<< HEAD
   MIDDLEWARE
================================ */
app.use(express.json());
=======
   MIDDLEWARE (สำคัญมาก)
================================ */
app.use(express.json()); // ⭐ ต้องมี
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
app.use(express.urlencoded({ extended: true }));

/* ===============================
   STATIC FILES
================================ */
app.use(express.static(path.join(__dirname, "public")));

<<<<<<< HEAD
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
=======
/* ===============================
   API ROUTES
================================ */
app.use("/api/patients", patientsRoutes);

/* ===============================
   SPA FALLBACK
================================ */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
<<<<<<< HEAD
  console.log(`🚀 NurseStationHub running at http://localhost:${PORT}`);
=======
  console.log(`🚀 Server running at http://localhost:${PORT}`);
>>>>>>> 1b22a2ddbf2509e01101c6b6158becc13945304b
});
