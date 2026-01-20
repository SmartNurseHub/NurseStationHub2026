/******************************************************************
 * patients.controller.js
 * IMPORT PATIENTS (CLEAN & SAFE)
 ******************************************************************/

const { importPatientsService } = require("./patients.service");

/* =========================
   CID NORMALIZE (13 DIGITS)
========================= */
function normalizeCID(cid) {
  if (cid === null || cid === undefined) return "";

  cid = String(cid);

  if (cid.includes("E") || cid.includes("e")) {
    cid = Number(cid).toFixed(0);
  }

  return cid
    .replace(/'/g, "")
    .replace(/\D/g, "")
    .padStart(13, "0");
}

/* =========================================================
   POST /api/patients/import
========================================================= */
exports.importPatients = async (req, res) => {
  try {
    const rows = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload"
      });
    }

    /* -----------------------------
       1) NORMALIZE + VALIDATE
    ----------------------------- */
    const validRows = rows
      .map(r => ({
        ...r,
        CID: normalizeCID(r.CID)
      }))
      .filter(r =>
        r.CID &&
        r.CID.length === 13 &&
        r.NAME &&
        r.LNAME
      );

    if (validRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid patient data"
      });
    }

    /* -----------------------------
       2) IMPORT (UPSERT)
    ----------------------------- */
    const result = await importPatientsService(validRows);

    res.json({
  success: true,
  updated: result.updated,
  inserted: result.inserted
});

  } catch (err) {
    console.error("IMPORT PATIENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
