const express = require("express");
const router = express.Router();
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

router.post("/import", async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ message: "empty payload" });
    }

    /* ===============================
       AUTH
    ================================ */
    const creds = JSON.parse(
      Buffer.from(process.env.GOOGLE_CREDENTIAL_BASE64, "base64").toString("utf8")
    );

    const auth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[process.env.SHEET_PATIENTS];
    if (!sheet) throw new Error("Sheet not found");
    /* ✅ สำคัญมาก */
await sheet.loadHeaderRow();


    /* ===============================
       HEADER SAFE MAP
    ================================ */
    const headers = sheet.headerValues.map(h => h.trim());
    const hnIndex = headers.findIndex(h => h === "HN");

    if (hnIndex === -1) {
      throw new Error("HN column not found (check header spelling)");
    }

    const rows = await sheet.getRows();

    const rowMap = new Map();
    rows.forEach(r => {
      const hn = String(r._rawData[hnIndex] || "").trim();
      if (hn) rowMap.set(hn, r);
    });

    /* ===============================
       DEDUPE PAYLOAD
    ================================ */
    const uniquePayload = new Map();
    payload.forEach(p => {
      const hn = String(p.HN || "").trim();
      if (hn) uniquePayload.set(hn, p);
    });

    let inserted = 0;
    let updated = 0;

    /* ===============================
       UPSERT
    ================================ */
    for (const [hn, p] of uniquePayload.entries()) {
      if (rowMap.has(hn)) {
        const row = rowMap.get(hn);
        row.CID = String(p.CID || "");
        row.PRENAME = p.PRENAME || "";
        row.NAME = p.NAME || "";
        row.LNAME = p.LNAME || "";
        row.SEX = p.SEX || "";
        row.BIRTH = p.BIRTH || "";
        row.TELEPHONE = p.TELEPHONE || "";
        row.MOBILE = p.MOBILE || "";
        await row.save();
        updated++;
      } else {
        const newRow = await sheet.addRow({
          CID: String(p.CID || ""),
          PRENAME: p.PRENAME || "",
          NAME: p.NAME || "",
          LNAME: p.LNAME || "",
          HN: hn,
          SEX: p.SEX || "",
          BIRTH: p.BIRTH || "",
          TELEPHONE: p.TELEPHONE || "",
          MOBILE: p.MOBILE || ""
        });
        rowMap.set(hn, newRow);
        inserted++;
      }
    }

    res.json({
      success: true,
      inserted,
      updated,
      total: inserted + updated
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
