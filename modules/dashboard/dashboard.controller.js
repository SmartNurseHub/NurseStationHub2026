/*****************************************************************
 * dashboard.controller.js (CLEAN & COMMENTED VERSION)
 *
 * แนวคิด:
 * - Controller layer สำหรับหน้า Dashboard
 * - รับ request จาก client → เรียก service → ส่ง JSON response
 * - รองรับ: dashboard summary, follow list, update follow, delete follow by CID
 *****************************************************************/

const dashboardService = require("./dashboard.service");


/*****************************************************************
 * FUNCTION: getDashboardSummary
 * หน้าที่:
 * - ดึงภาพรวมสถิติ Dashboard
 * - Response: JSON { patients, appointmentsToday, records, pending }
 *****************************************************************/
async function getDashboardSummary(req, res) {
  try {
    const summary = await dashboardService.getDashboardSummaryService();
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error("dashboard summary error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}


/*****************************************************************
 * FUNCTION: getFollowList
 * หน้าที่:
 * - ดึงรายการผู้ติดตาม LINE OA จาก Google Sheets
 * - Response: JSON array ของ followers
 *****************************************************************/
async function getFollowList(req, res) {
  try {
    const data = await dashboardService.getFollowListService();
    res.json({ success: true, data });
  } catch (err) {
    console.error("follow list error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}


/*****************************************************************
 * FUNCTION: updateFollow
 * หน้าที่:
 * - อัปเดตข้อมูลการเชื่อม LINE UID กับผู้ป่วย
 * - รับ body: { userId, fullName, cid }
 * - Validation: userId ต้องมี, cid ต้อง 13 หลัก (ถ้ามี)
 * - Response: JSON success/fail
 *****************************************************************/
async function updateFollow(req, res) {
  try {
    const { userId, fullName, cid } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId required" });
    }
    if (cid && cid.length !== 13) {
      return res.status(400).json({ success: false, message: "CID must be 13 digits" });
    }

    await dashboardService.updateFollowService(userId, fullName, cid);

    res.json({ success: true, message: "Updated successfully" });
  } catch (err) {
    console.error("update follow error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}


/*****************************************************************
 * FUNCTION: deleteFollowByCid
 * หน้าที่:
 * - ลบ follower ตาม CID
 * - รับ param: cid
 * - Response: JSON success/fail
 * - ใช้ service deleteFollowByCidService
 *****************************************************************/
async function deleteFollowByCid(req, res) {
  try {
    const { cid } = req.params;
    if (!cid) {
      return res.status(400).json({ success: false, message: "cid required" });
    }

    await dashboardService.deleteFollowByCidService(cid);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    console.error("deleteFollowByCid error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}


/*****************************************************************
 * MODULE: EXPORT
 * ส่งออกฟังก์ชันทั้งหมดให้ route ใช้งาน
 *****************************************************************/
module.exports = {
  getDashboardSummary,
  getFollowList,
  updateFollow,
  deleteFollowByCid
};