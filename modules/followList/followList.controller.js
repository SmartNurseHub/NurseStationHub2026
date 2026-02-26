const service = require("./followList.service");

exports.getFollowList = async (req, res) => {
  try {
    const data = await service.getFollowList();
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error("FollowList error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load follow list"
    });
  }
};