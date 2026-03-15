/******************************************************************
 * vaccination.controller.js
 * FINAL CLEAN STABLE VERSION
 ******************************************************************/

const service = require("./vaccination.service");

/* =====================================================
   GET VACCINE MASTER
===================================================== */
exports.getVaccineMaster = async (req, res) => {

  try {

    const data = await service.getVaccineMaster();

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("❌ getVaccineMaster error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};


/* =====================================================
   GET PATIENT
===================================================== */
exports.getPatient = async (req, res) => {

  try {

    const { cid } = req.params;

    if (!cid || cid.length !== 13) {
  return res.status(400).json({
    success: false,
    message: "CID must be 13 digits"
  });
} 
    const data = await service.getPatient(cid);

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("❌ getPatient error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};


/* =====================================================
   GET VACCINATION RECORDS
===================================================== */
exports.getVaccinationByCID = async (req, res) => {

  try {

    const { cid } = req.params;

    if (!cid) {

      return res.status(400).json({
        success: false,
        message: "CID is required"
      });

    }

    const data = await service.getVaccinationRecords(cid);

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("❌ getVaccinationByCID error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};


/* =====================================================
   GET VACCINATION TIMELINE
===================================================== */
exports.getVaccinationTimeline = async (req, res) => {

  try {

    const { cid } = req.params;

    if (!cid) {

      return res.status(400).json({
        success: false,
        message: "CID is required"
      });

    }

    const data = await service.getVaccinationTimeline(cid);

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("❌ getVaccinationTimeline error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};


/* =====================================================
   ADD VACCINATION
===================================================== */
exports.addVaccination = async (req, res) => {

  try {

    console.log("📥 vaccination input:", req.body);

    const result = await service.saveVaccination(req.body);

    res.json(result);

  } catch (err) {

    console.error("❌ saveVaccination error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};


/* =====================================================
   EXPORT CERTIFICATE
===================================================== */
exports.exportCertificate = async (req, res) => {

  try {

    const { cid } = req.params;

    if (!cid) {

      return res.status(400).json({
        success: false,
        message: "CID is required"
      });

    }

    const data =
      await service.getVaccinationRecords(cid);

    res.setHeader("Content-Type", "application/json");

    res.setHeader(
      "Content-Disposition",
      `inline; filename=vaccine_${cid}.json`
    );

    res.send(JSON.stringify(data, null, 2));

  } catch (err) {

    console.error("❌ exportCertificate error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};

/* =====================================================
   GET LATEST VACCINES
===================================================== */
exports.getLatestVaccines = async (req, res) => {

  try {

    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        success: false,
        message: "CID is required"
      });
    }

    const data = await service.getLatestVaccines(cid);

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("❌ getLatestVaccines error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};


/* =====================================================
   GET VACCINATION HISTORY
===================================================== */
exports.getVaccinationHistory = async (req, res) => {

  try {

    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        success: false,
        message: "CID is required"
      });
    }

    const data = await service.getVaccinationHistory(cid);

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("❌ getVaccinationHistory error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};

/* =====================================================
   GET NEXT VCN
===================================================== */
exports.getNextVCN = async (req, res) => {

  try {

    const data = await service.getNextVCN();

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("❌ getNextVCN error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};

exports.getLatestVaccination = async (req, res) => {

  try {

    const data = await service.getLatest();

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

};

exports.timeline = async (req,res)=>{

  const cid = req.params.cid;

  const data = await service.timeline(cid);

  res.json({
    success:true,
    data
  });

};

exports.latest = async (req,res)=>{

  const cid = req.params.cid;

  const data = await service.latest(cid);

  res.json({
    success:true,
    data
  });

};

exports.history = async (req,res)=>{

  const cid = req.params.cid;

  const data = await service.history(cid);

  res.json({
    success:true,
    data
  });

};

exports.getAppointments = async (req, res) => {

  try {

    const { cid } = req.params;

    const data = await service.getAppointments(cid);

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("❌ getAppointments error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};

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

exports.sendLineVaccine = async (req, res) => {

  try {

    const { vcn } = req.params;

    const result =
      await service.sendLineVaccine(vcn);

    res.json({
      success: true,
      result
    });

  } catch (err) {

    console.error("sendLineVaccine error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};