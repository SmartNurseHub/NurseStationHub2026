const express = require("express");
const router = express.Router();
const controller = require("./lineUID.controller");
const { appendRow } = require("../../config/google"); // ⭐ เพิ่มบรรทัดนี้

router.get("/", controller.getLineUID);
router.post("/", controller.addLineUID);
router.delete("/delete/:userId", controller.deleteLineUID);
// บันทึก LineUID ลง Google Sheet
router.post("/save", async (req, res) => {

  try {  console.log("BODY =", req.body);
    const {
  cid,
  name,
  lname,
  userId,
  displayName,
  status,
  picture,
  pictureUrl
} = req.body;

    if (!cid || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing CID or userId"
      });
    }

    await appendRow(process.env.SHEET_LineUID, [
  new Date().toISOString(),
  cid || "",
  name || "",
  lname || "",
  userId || "",
  displayName || "",
  pictureUrl || "",
  status || ""
]);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ LineUID Save Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



module.exports = router;