const cron = require("node-cron");
const { getSheet } = require("../config/google");
const { sendResult } = require("../modules/nursingRecords/nursingRecords.service");

cron.schedule("*/09 * * * *", async () => {
  const rows = await getSheet("NursingRecords");
  const headers = rows[0];
  const statusIdx = headers.indexOf("status");
  const nsrIdx = headers.indexOf("NSR");

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][statusIdx] === "PENDING") {
      await sendResult(rows[i][nsrIdx]);
    }
  }
});