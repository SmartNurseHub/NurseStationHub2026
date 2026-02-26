const service = require("./lineUID.service");

exports.getLineUID = async (req, res) => {
  try {
    const data = await service.getLineUIDList();
    res.json({ success: true, data });
  } catch (err) {
    console.error("LineUID load error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load LineUID"
    });
  }
};

exports.addLineUID = async (req, res) => {
  try {
    await service.addLineUID(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("LineUID save error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save LineUID"
    });
  }
};


exports.deleteLineUID = async (req, res) => {
  try {
    const { userId } = req.params;
    await service.deleteLineUID(userId);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
