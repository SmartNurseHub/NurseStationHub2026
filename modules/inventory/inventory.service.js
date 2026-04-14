const repo = require("./inventory.repo");

/* ===============================
   GET MASTER
================================ */
async function getMaster() {
  return await repo.getMaster();
}

/* ===============================
   SAVE MASTER
================================ */
async function saveMaster(data) {

  if (!Array.isArray(data)) {
    throw new Error("payload must be array");
  }

  if (data.length > 2000) {
    throw new Error("data too large");
  }

  return await repo.replaceMaster(data);
}

async function getLot(){
  return repo.getLot();
}

async function saveLot(data){
  return repo.replaceLot(data);
}

async function deleteLot(lotId){
  return repo.deleteLot(lotId);
}

module.exports = {
  getMaster,
  saveMaster,
  getLot,
  saveLot,
  deleteLot
};