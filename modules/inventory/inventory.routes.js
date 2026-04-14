const express = require("express");
const router = express.Router();
const ctrl = require("./inventory.controller");

/* ===============================
   UI
================================ */
router.get("/", (req,res)=>{
  res.sendFile(__dirname + "/inventory.view.html");
});

/* ===============================
   MASTER API
================================ */
router.get("/master", ctrl.getMaster);
router.post("/master", ctrl.saveMaster);
router.get("/lot", ctrl.getLot);
router.post("/lot", ctrl.saveLot);
router.post("/lot/delete", ctrl.deleteLot);
router.get("/lot", ctrl.getLot);
router.post("/lot", ctrl.saveLot);

module.exports = router;