/*****************************************************************
 * dashboard.routes.js (CLEAN VERSION)
 *
 * แนวคิด:
 * - Routing layer สำหรับ Dashboard
 * - เชื่อม HTTP endpoint → controller
 *****************************************************************/

const express = require("express");
const router = express.Router();

/*****************************************************************
 * MODULE: CONTROLLER IMPORT
 *****************************************************************/
const controller = require("./dashboard.controller");

/*****************************************************************
 * DASHBOARD ROUTES
 *****************************************************************/

/* ===============================
   GET DASHBOARD SUMMARY
================================ */
router.get("/summary", controller.getDashboardSummary);

/* ===============================
   GET FOLLOW LIST
================================ */
router.get("/followList", controller.getFollowList);

/* ===============================
   UPDATE FOLLOW (CID + Name)
================================ */
router.post("/followList/update", controller.updateFollow);

/* ===============================
   DELETE FOLLOW BY CID
================================ */
router.delete("/lineuid/delete/:cid", controller.deleteFollowByCid);

/*****************************************************************
 * EXPORT ROUTER
 *****************************************************************/
module.exports = router;