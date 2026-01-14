const router = require("express").Router();
const ctrl = require("../controllers/nursing.controller");

router.get("/", ctrl.getNursingRecords);

module.exports = router;
