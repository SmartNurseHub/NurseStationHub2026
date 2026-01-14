/******************************************************************
 * server.js
 * Smart Nurse Hub — PRODUCTION CSP FIXED
 ******************************************************************/

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
 * CORS (Production)
 * ======================================================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || false,
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

        /* ---------- FETCH / MAP FILE ---------- */
        connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com"
        ],

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
 * ======================================================= */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
 * STATIC FILES
 * ======================================================= */
app.use(express.static(path.join(__dirname, "public")));
app.use("/views", express.static(path.join(__dirname, "public/views")));

/* =========================================================
 * API
 * ======================================================= */
app.use("/api/patients", require("./routes/patients.routes"));

/* =========================================================
 * API 404
 * ======================================================= */
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

/* =========================================================
 * SPA FALLBACK
 * ======================================================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================================================
 * START
 * ======================================================= */
app.listen(PORT, () => {
  console.log(`✅ Smart Nurse Hub running at http://localhost:${PORT}`);
});
