/*****************************************************************
 * LINE UID ROUTES MODULE
 * NurseStationHub
 *
 * ---------------------------------------------------------------
 * หน้าที่:
 * - กำหนด API endpoints สำหรับจัดการ LineUID
 * - เชื่อม request ไปยัง controller
 *
 * ---------------------------------------------------------------
 * ROUTE LIST:
 *
 * [READ]
 * - GET    /
 *
 * [CREATE]
 * - POST   /save
 *
 * [DELETE]
 * - DELETE /delete/:cid
 *
 * ---------------------------------------------------------------
 * FLOW:
 * Client → Routes → Controller → Service → Google Sheet
 *****************************************************************/


/* =========================================================
   IMPORTS
========================================================= */

const express = require("express");
const router = express.Router();

const controller = require("./lineUID.controller");


/* =========================================================
   READ API
========================================================= */

/**
 * @route   GET /
 * @desc    ดึงรายการ LineUID ทั้งหมด
 */
router.get("/", controller.getLineUID);


/* =========================================================
   CREATE API
========================================================= */

/**
 * @route   POST /save
 * @desc    เพิ่มข้อมูล LineUID
 */
router.post("/save", controller.addLineUID);


/* =========================================================
   DELETE API
========================================================= */

/**
 * @route   DELETE /delete/:cid
 * @desc    ลบข้อมูล LineUID ตาม CID
 */
router.delete("/delete/:cid", controller.deleteLineUID);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;