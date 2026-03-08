/******************************************************************
 * vaccination.reminder.service.js
 ******************************************************************/

const { readRows } = require("../../config/google");
const lineService = require("../lineOA/lineOA.service");
const SHEET = "Vaccination";

async function checkAndSendReminders() {

  try {

    const rows = await readRows(SHEET);

    if (!rows || rows.length <= 1) return;

    const today = new Date().toISOString().slice(0,10);

    for (let i = 1; i < rows.length; i++) {

      const r = rows[i];

      const cid = r[1];
      const name = r[2];
      const vaccine = r[4];
      const nextDate = r[6];
      const lineUID = r[8];

      if (!nextDate || !lineUID) continue;

      if (nextDate === today) {

        await lineService.pushMessage(lineUID,{
          type:"text",
          text:`💉 แจ้งเตือนวัคซีน\n\nคุณ ${name}\nถึงกำหนดรับวัคซีน ${vaccine} วันนี้`
        });

        console.log("Reminder sent:", cid);

      }

    }

  } catch(err) {

    console.error("Vaccination Reminder Error:", err);

  }

}

module.exports = {
  checkAndSendReminders
};