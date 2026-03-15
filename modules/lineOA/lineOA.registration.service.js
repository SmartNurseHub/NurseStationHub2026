exports.handleRegistrationFlow = async (lineClient, userId, text, replyToken) => {

  try {

    text = (text || "").trim();

    const rows = await readRows(LINE_UID_SHEET);

    const rowIndex = rows.findIndex((r,i)=>
      i>0 && String(r[4]||"").trim() === userId
    );

    if(rowIndex === -1) return false;

    const row = rows[rowIndex];
    const status = String(row[7] || "").trim();

    console.log("Registration flow:",userId,"status:",status);

    /* ===== STEP 1 : CID ===== */

    if(status === "PENDING_CID"){

      if(!/^\d{13}$/.test(text)){

        await lineClient.replyMessage(replyToken,{
          type:"text",
          text:"กรุณากรอกเลขบัตรประชาชน 13 หลัก"
        });

        return true;
      }

      row[1] = text;
      row[7] = "PENDING_NAME";

      await lineClient.replyMessage(replyToken,{
        type:"text",
        text:"กรุณากรอกชื่อ–นามสกุล"
      });

      await updateRow(LINE_UID_SHEET,rowIndex+1,row);

      return true;
    }

    /* ===== STEP 2 : NAME ===== */

    if(status === "PENDING_NAME"){

      const parts = text.split(" ");

      if(parts.length < 2){

        await lineClient.replyMessage(replyToken,{
          type:"text",
          text:"กรุณากรอกชื่อและนามสกุล เว้นวรรค 1 ครั้ง"
        });

        return true;
      }

      row[2] = parts[0];
      row[3] = parts.slice(1).join(" ");
      row[7] = "PENDING_PHONE";

      await lineClient.replyMessage(replyToken,{
        type:"text",
        text:"กรุณากรอกเบอร์โทรศัพท์"
      });

      await updateRow(LINE_UID_SHEET,rowIndex+1,row);

      return true;
    }

    /* ===== STEP 3 : PHONE ===== */

    if(status === "PENDING_PHONE"){

      if(!/^0\d{8,9}$/.test(text)){

        await lineClient.replyMessage(replyToken,{
          type:"text",
          text:"กรุณากรอกเบอร์โทรให้ถูกต้อง"
        });

        return true;
      }

      row[8] = text;
      row[7] = "ACTIVE";

      await lineClient.replyMessage(replyToken,{
        type:"text",
        text:"ลงทะเบียนสำเร็จ"
      });

      await updateRow(LINE_UID_SHEET,rowIndex+1,row);

      return true;
    }

    return false;

  } catch(err){

    console.error("Registration flow error:",err);

    return false;
  }

};