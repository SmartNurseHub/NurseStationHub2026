/*************************************************
 * routes/upload.routes.js
 * -----------------------------------------------
 * Routes: Upload API
 *
 * Base path:
 * - /api/upload
 *
 * Endpoints:
 * - POST /text   → upload TXT (raw text)
 *************************************************/

const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload.controller");

/* =================================================
   POST /api/upload/text
================================================= */
router.post("/text", uploadController.uploadTxt);

module.exports = router;
