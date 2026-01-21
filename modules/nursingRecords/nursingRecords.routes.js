/******************************************************************
 * modules/nursingRecords/nursingRecords.routes.js
 ******************************************************************/
const express = require("express");
const router = express.Router();
const controller = require("./nursingRecords.controller");

/* =========================================================
   NURSING RECORDS API
========================================================= */

// ดึงรายการ Nursing Records ทั้งหมด
router.get("/", controller.getAll);

// ดึง NSR No. ถัดไป (ใช้ตอนเปิดฟอร์ม)
router.get("/next-nsr", controller.getNextNSR);

// บันทึก Nursing Record
router.post("/", controller.save);

module.exports = router;
