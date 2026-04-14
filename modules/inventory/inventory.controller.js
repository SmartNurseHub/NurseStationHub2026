const service = require("./inventory.service");

let isSaving = false;

/* ===============================
   GET MASTER
================================ */
async function getMaster(req, res) {
  try {
    const data = await service.getMaster();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "master error" });
  }
}

/* ===============================
   SAVE MASTER (FIXED)
================================ */
async function saveMaster(req, res) {
  try {

    if (isSaving) {
      return res.status(429).json({
        error: "System busy, please wait"
      });
    }

    isSaving = true;

    console.log("📦 BODY:", req.body);

    if (!Array.isArray(req.body)) {
      return res.status(400).json({
        error: "payload must be array"
      });
    }

    const result = await service.saveMaster(req.body);

    res.json({
      success: true,
      result
    });

  } catch (err) {

    console.error("🔥 INVENTORY ERROR:", err);

    res.status(500).json({
      error: err.message,
      stack: err.stack
    });

  } finally {
    isSaving = false;
  }
}

async function getLot(req,res){
  const data = await service.getLot();
  res.json(data);
}

async function getLot(){
  const rows = await readRowsById(DB, SHEET_LOT);

  if(!rows || rows.length<=1) return [];

  const [, ...data] = rows;

  return data.map(r=>({
    Lotid:r[0],
    Item_id:r[1],
    lot:r[2],
    Exp:r[3],
    Qty:Number(r[4]||0),
    Status:r[5],
    QRCode:r[6],
    providers:r[7]
  }));
}
async function saveLot(req,res){
  const result = await service.saveLot(req.body);
  res.json({success:true,result});
}

async function deleteLot(req,res){
  const {Lotid} = req.body;
  const result = await service.deleteLot(Lotid);
  res.json({success:true,result});
}

async function getLot(req,res){
  const data = await service.getLot();
  res.json(data);
}

async function saveLot(req,res){
  const result = await service.saveLot(req.body);
  res.json(result);
}

module.exports = {
  getMaster,
  saveMaster,
  getLot,
  saveLot,
  deleteLot
};