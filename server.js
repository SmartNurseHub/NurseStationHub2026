/*************************************************
 * server.js — FIXED VERSION
 *************************************************/

require("dotenv").config();
const express = require("express");
const path = require("path");

const patientsRoutes = require("./routes/patients.routes");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   MIDDLEWARE (สำคัญมาก)
================================ */
app.use(express.json()); // ⭐ ต้องมี
app.use(express.urlencoded({ extended: true }));

/* ===============================
   STATIC FILES
================================ */
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   API ROUTES
================================ */
app.use("/api/patients", patientsRoutes);

/* ===============================
   SPA FALLBACK
================================ */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
