const Redis = require("ioredis");
const lineService = require("../../lineOA/lineOA.service");
const { logInfo, logError } = require("../core/logger");

const redis = new Redis(process.env.REDIS_URL);

// LOCK
async function acquireLock(key, ttl=15000){
  const res = await redis.set(key,"1","PX",ttl,"NX");
  return res==="OK";
}

async function releaseLock(key){
  await redis.del(key);
}

// IDEMPOTENCY
async function isExists(key){
  return (await redis.exists(key))===1;
}

async function setKey(key,ttl){
  await redis.set(key,"1","PX",ttl);
}

async function sendLineVaccine(vcn, getVaccinationByVCN, getPatient, getVaccineMaster){

  const lockKey = `lock:line:${vcn}`;
  const sendingKey = `sending:${vcn}`;
  const sentKey = `sent:${vcn}`;

  const locked = await acquireLock(lockKey);
  if(!locked) return { skipped:"LOCKED" };

  try{

    if(await isExists(sentKey)) return { skipped:"ALREADY_SENT" };
    if(await isExists(sendingKey)) return { skipped:"SENDING" };

    await setKey(sendingKey,30000);

    const record = await getVaccinationByVCN(vcn);
    if(!record) throw new Error("record not found");

    const patient = await getPatient(record.cid);
    if(!patient?.lineUID) throw new Error("lineUID not found");

    const flex = {
      type:"text",
      text:`ฉีดวัคซีนแล้ว ${record.vaccineCode}`
    };

    await lineService.pushMessage(patient.lineUID, flex);

    await setKey(sentKey,86400000);

    return { success:true };

  }catch(err){
    logError("LINE_ERROR",err.message);
    return { success:false, error:err.message };
  }
  finally{
    await releaseLock(lockKey);
    await redis.del(sendingKey);
  }
}

module.exports = {
  sendLineVaccine,
  acquireLock,
  releaseLock,
  isExists,
  setKey
};