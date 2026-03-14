/******************************************************************
 * vaccination.reminder.service.js
 ******************************************************************/

const { readRows } = require("../../config/google");
const lineService = require("../lineOA/lineOA.service");

const SHEET_REMINDER = "Reminder";
const SHEET_LINEUID = "LineUID";

async function checkAndSendReminders() {

  try {

    const reminderRows = await readRows(SHEET_REMINDER);
    const lineRows = await readRows(SHEET_LINEUID);

    if (!reminderRows || reminderRows.length <= 1) return;

    const today = new Date().toLocaleDateString("sv-SE");

    /* =============================
       สร้าง map CID → LINE UID
    ============================= */

    const lineMap = {};

    for (let i = 1; i < lineRows.length; i++) {

      const cid = lineRows[i][1];
      const userId = lineRows[i][4];

      if (cid && userId) {
        lineMap[cid] = userId;
      }

    }

    /* =============================
       ตรวจ reminder
    ============================= */

    for (let i = 1; i < reminderRows.length; i++) {

      const r = reminderRows[i];

      const reminderId = r[0];
      const cid = r[2];
      const vaccine = r[4];
      const dose = r[5];
      const appointmentDate = r[6];
      const notifyDate = r[7];
      const status = r[10];

      const userId = lineMap[cid];

      if (!notifyDate || !userId) continue;

      if (
        notifyDate === today &&
        status === "PENDING"
      ) {

        await lineService.pushMessage(userId,{
          type:"text",
          text:`💉 แจ้งเตือนนัดวัคซีน

วัคซีน ${vaccine}
เข็มที่ ${dose}

📅 วันนัด ${appointmentDate}`
        });

        console.log("Reminder sent:", reminderId);

      }

    }

  } catch(err) {

    console.error("Vaccination Reminder Error:", err);

  }

}

module.exports = {
  checkAndSendReminders
};