/*************************************************
 * modules/dashboard/dashboard.controller.js
 *************************************************/

const dashboardService = require("./dashboard.service");

/* ===============================
   GET SUMMARY
================================ */
async function getDashboardSummary(req, res) {
  try {
    const summary = await dashboardService.getDashboardSummaryService();

    res.json({
      success: true,
      data: summary
    });

  } catch (err) {
    console.error("dashboard summary error:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

/* ===============================
   GET FOLLOW LIST
================================ */
async function getFollowList(req, res) {
  try {
    const data = await dashboardService.getFollowListService();

    res.json({
      success: true,
      data
    });

  } catch (err) {
    console.error("follow list error:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

/* ===============================
   UPDATE FOLLOW
================================ */
async function updateFollow(req, res) {
  try {
    const { userId, fullName, cid } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId required"
      });
    }

    if (cid && cid.length !== 13) {
      return res.status(400).json({
        success: false,
        message: "CID must be 13 digits"
      });
    }

    await dashboardService.updateFollowService(userId, fullName, cid);

    res.json({
      success: true,
      message: "Updated successfully"
    });

  } catch (err) {
    console.error("update follow error:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

/* ===============================
   DELETE FOLLOW
================================ */
async function deleteFollow(req, res) {
  try {
    const { rowIndex } = req.body;

    if (rowIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: "rowIndex required"
      });
    }

    await dashboardService.deleteFollowService(rowIndex);

    res.json({
      success: true,
      message: "Deleted successfully"
    });

  } catch (err) {
    console.error("deleteFollow error:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = {
  getDashboardSummary,
  getFollowList,
  updateFollow,
  deleteFollow
};