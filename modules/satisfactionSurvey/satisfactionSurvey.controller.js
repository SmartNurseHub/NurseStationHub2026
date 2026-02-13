const path = require("path");
const service = require("./satisfactionSurvey.service");

exports.renderSurvey = (req, res) => {
  const filePath = path.join(
    __dirname,
    "views",
    "satisfactionSurvey.view.html"
  );

  console.log("📄 Render survey:", filePath);
  res.sendFile(filePath);
};

exports.submitSurvey = async (req, res) => {
  try {
    console.log("📩 survey payload:", req.body);
    const result = await service.saveSurvey(req.body);
    return res.json(result);
  } catch (err) {
    console.error("❌ submitSurvey error:", err);
    return res.status(500).json({ status: "error" });
  }
};
