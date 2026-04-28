/******************************************************************
 * VACCINATION CONTROLLER (FINAL CLEAN STABLE VERSION)
 * Handles all Vaccination-related API endpoints
 ******************************************************************/

const service = require("./vaccination.service");

/******************************************************************
 * VACCINE MASTER
 * GET /api/vaccination/master
 ******************************************************************/
exports.getVaccineMaster = async (req, res) => {
  try {
    const data = await service.getVaccineMaster();
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getVaccineMaster error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * PATIENT INFO
 * GET /api/patients/:cid
 ******************************************************************/
exports.getPatient = async (req, res) => {
  try {
    const { cid } = req.params;
    if (!cid || cid.length !== 13) {
      return res.status(400).json({ success: false, message: "CID must be 13 digits" });
    }
    const data = await service.getPatient(cid);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getPatient error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * VACCINATION RECORDS
 * GET /api/vaccination/:cid
 ******************************************************************/
exports.getVaccinationByCID = async (req, res) => {
  try {
    const { cid } = req.params;
    if (!cid) return res.status(400).json({ success: false, message: "CID is required" });
    const data = await service.getVaccinationRecords(cid);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getVaccinationByCID error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * VACCINATION TIMELINE
 * GET /api/vaccination/timeline/:cid
 ******************************************************************/
exports.getVaccinationTimeline = async (req, res) => {
  try {
    const { cid } = req.params;
    if (!cid) return res.status(400).json({ success: false, message: "CID is required" });
    const data = await service.getVaccinationTimeline(cid);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getVaccinationTimeline error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * ADD VACCINATION
 * POST /api/vaccination/add
 ******************************************************************/
exports.addVaccination = async (req, res) => {
  try {
    console.log("📥 vaccination input:", req.body);
    const result = await service.saveVaccination(req.body);
    res.json(result);
  } catch (err) {
    console.error("❌ saveVaccination error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * EXPORT CERTIFICATE (JSON)
 * GET /api/vaccination/export/:cid
 ******************************************************************/
exports.exportCertificate = async (req, res) => {
  try {
    const { cid } = req.params;
    if (!cid) return res.status(400).json({ success: false, message: "CID is required" });
    const data = await service.getVaccinationRecords(cid);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `inline; filename=vaccine_${cid}.json`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ exportCertificate error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * LATEST VACCINES
 * GET /api/vaccination/latest/:cid
 ******************************************************************/
exports.getLatestVaccines = async (req, res) => {
  try {
    const { cid } = req.params;
    if (!cid) return res.status(400).json({ success: false, message: "CID is required" });
    const data = await service.getLatestVaccines(cid);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getLatestVaccines error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * VACCINATION HISTORY
 * GET /api/vaccination/history/:cid
 ******************************************************************/
exports.getVaccinationHistory = async (req, res) => {
  try {
    const { cid } = req.params;
    if (!cid) return res.status(400).json({ success: false, message: "CID is required" });
    const data = await service.getVaccinationHistory(cid);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getVaccinationHistory error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * NEXT VCN
 * GET /api/vaccination/next-vcn
 ******************************************************************/
exports.getNextVCN = async (req, res) => {
  try {
    const data = await service.getNextVCN();
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getNextVCN error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * OTHER HELPERS
 ******************************************************************/
exports.getLatestVaccination = async (req, res) => {
  try {
    const data = await service.getLatest();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



/******************************************************************
 * APPOINTMENTS
 * GET /api/vaccination/appointments/:cid
 ******************************************************************/
exports.getAppointments = async (req, res) => {
  try {
    const { cid } = req.params;
    const data = await service.getAppointments(cid);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getAppointments error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * DELETE VACCINATION
 * DELETE /api/vaccination/:vcn
 ******************************************************************/
exports.deleteVaccination = async (req, res) => {
  try {
    const { vcn } = req.params;
    const result = await service.deleteVaccination(vcn);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/******************************************************************
 * SEND LINE VACCINE
 * POST /api/vaccination/send-line/:vcn
 ******************************************************************/
exports.sendLineVaccine = async (req, res) => {
  try {
    const { vcn } = req.params;

    const result = await service.sendLineVaccine(vcn);

    res.json({ success: true, result });

  } catch (err) {
    console.error("sendLineVaccine error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/******************************************************************
 * SECURE HISTORY FOR LINE
 * GET /api/vaccination/history-secure/:cid/:lineUID
 ******************************************************************/
exports.historySecure = async (req,res)=>{
  try{
    const { cid , lineUID } = req.params;
    const patient = await service.getPatient(cid);

    if(!patient){
      return res.status(404).json({ error:"patient not found" });
    }

    const dbUID  = String(patient.lineUID || "").trim();
    const reqUID = String(lineUID || "").trim();

    console.log("CID:",cid);
    console.log("REQ UID:",reqUID);
    console.log("DB UID:",dbUID);

    if(dbUID !== reqUID){
      return res.status(403).json({ error:"unauthorized" });
    }

    const history = await service.getVaccinationHistory(cid);
    res.json(history);
  }catch(err){
    console.error(err);
    res.status(500).json({ error:"server error" });
  }
};

/******************************************************************
 * DASHBOARD SUMMARY
 * GET /api/vaccination/dashboard
 ******************************************************************/
exports.getDashboard = async (req, res) => {
  try {
    const data = await service.getDashboardSummary(); // ✅ ใช้ service
    res.json({ ok: true, data });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ ok: false });
  }
};
/******************************************************************
 * VACCINE SCHEDULE
 * GET /api/vaccination/schedule
 ******************************************************************/
exports.getSchedule = async (req, res) => {
  try {
    const data = await service.getSchedule();
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ schedule error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendLineByButton = async (req, res) => {
  try {

    const { vcn } = req.params;

    if (!vcn) {
      return res.status(400).json({
        success: false,
        message: "vcn required"
      });
    }

    const result = await service.sendLineByButton(vcn);

    res.json(result);

  } catch (err) {
    console.error("sendLineByButton error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};