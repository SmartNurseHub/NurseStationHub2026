/******************************************************************
 * server.js
 * Smart Nurse Hub — FINAL MERGED (DEV + PRODUCTION READY)
 ******************************************************************/
"use strict";

require("dotenv").config();
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
 * LOGGING
 * ======================================================= */
app.use(morgan("combined"));

/* =========================================================
 * CORS (SAFE FOR DEV + PROD)
 * ======================================================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
  })
);

/* =========================================================
 * SECURITY + CSP (MATCH REAL USAGE)
 * ======================================================= */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],

        /* ---------- SCRIPT ---------- */
        scriptSrc: [
          "'self'",
          "https://code.jquery.com",
          "https://cdn.jsdelivr.net",
          "https://cdn.datatables.net"
        ],
        scriptSrcElem: [
          "'self'",
          "https://code.jquery.com",
          "https://cdn.jsdelivr.net",
          "https://cdn.datatables.net"
        ],

        /* ---------- STYLE ---------- */
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdn.datatables.net",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrcElem: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdn.datatables.net",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],

        /* ---------- FONT ---------- */
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net"
        ],

        /* ---------- IMAGE ---------- */
        imgSrc: [
          "'self'",
          "data:",
          "https://i.pravatar.cc"
        ],

        /* ---------- FETCH / API ---------- */
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || "",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ].filter(Boolean),

        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },

    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false
  })
);

/* =========================================================
 * BODY PARSER
 * (ไม่กระทบ multipart upload)
 * ======================================================= */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
 * STATIC FILES (SPA)
 * ======================================================= */
app.use(express.static(path.join(__dirname, "public")));
app.use("/views", express.static(path.join(__dirname, "public/views")));

/* =========================================================
 * API ROUTES
 * ======================================================= */
app.use("/api/patients", require("./routes/patients.routes"));
app.use("/api/sheets", require("./routes/sheets.routes"));
app.use("/api/nursing", require("./routes/nursing.routes"));

/* =========================================================
 * API 404 (เฉพาะ /api)
 * ======================================================= */
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

/* =========================================================
 * SPA FALLBACK (ต้องอยู่ล่างสุด)
 * ======================================================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================================================
 * START SERVER
 * ======================================================= */
app.listen(PORT, () => {
  console.log(`🚀 Smart Nurse Hub running at http://localhost:${PORT}`);
});
