/******************************************************************
 * middlewares/upload.js
 ******************************************************************/
"use strict";

const multer = require("multer");
const path = require("path");
const os = require("os");

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `patients_${Date.now()}${ext}`);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

module.exports = upload;
