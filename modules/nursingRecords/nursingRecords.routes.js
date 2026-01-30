/******************************************************************
 * modules/nursingRecords/nursingRecords.routes.js
 ******************************************************************/
const express = require("express");
const router = express.Router();

const controller = require("./nursingRecords.controller");

/* =========================================================
   GET ALL
========================================================= */
router.get("/", controller.getAll);

/* =========================================================
   GET NEXT NSR
========================================================= */
router.get("/next-nsr", controller.getNextNSR);

/* =========================================================
   CREATE
========================================================= */
router.post("/", controller.save);

/* =========================================================
   UPDATE
========================================================= */
router.put("/:nsr", controller.update);


router.delete("/:nsr", controller.delete);

module.exports = router;
