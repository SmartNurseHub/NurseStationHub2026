/*****************************************************************
 * LINE UID CONTROLLER MODULE
 * NurseStationHub
 *
 * ---------------------------------------------------------------
 * หน้าที่:
 * - จัดการ API สำหรับ LineUID
 * - รับ request จาก client แล้วส่งต่อไปยัง service
 *
 * ---------------------------------------------------------------
 * FUNCTION LIST:
 *
 * 1. getLineUID(req, res)
 *    → ดึงรายการ LineUID ทั้งหมด
 *
 * 2. addLineUID(req, res)
 *    → เพิ่มข้อมูล LineUID
 *
 * 3. deleteLineUID(req, res)
 *    → ลบข้อมูล LineUID ตาม CID
 *
 * ---------------------------------------------------------------
 * FLOW:
 * Client → Controller → Service → Google Sheet
 *****************************************************************/


/* =========================================================
   IMPORTS
========================================================= */

const service = require("./lineUID.service");


/* =========================================================
   READ DATA
========================================================= */

/**
 * GET LineUID List
 */
exports.getLineUID = async (req, res) => {

  try {

    const data = await service.getLineUIDList();

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("LineUID load error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to load LineUID"
    });

  }

};


/* =========================================================
   CREATE DATA
========================================================= */

/**
 * ADD LineUID
 */
exports.addLineUID = async (req, res) => {

  try {

    await service.addLineUID(req.body);

    res.json({
      success: true
    });

  } catch (err) {

    console.error("LineUID save error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to save LineUID"
    });

  }

};


/* =========================================================
   DELETE DATA
========================================================= */

/**
 * DELETE LineUID by CID
 */
exports.deleteLineUID = async (req, res) => {

  try {

    const cid = req.params.cid;

    await service.deleteLineUID(cid);

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

};