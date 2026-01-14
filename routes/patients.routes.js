const express = require("express");
const multer = require("multer");
const router = express.Router();

const patients = require("../controllers/patients.controller");
const upload = multer({ storage: multer.memoryStorage() });

/* ===== LIST ===== */
router.get("/", patients.listPatients);

/* ===== UPLOAD (STREAMING) ===== */
router.post("/upload", upload.single("file"), patients.uploadPatients);

module.exports = router;
