const pool = require("../db");

/**
 * UPSERT Patient
 * - ถ้า cid มีอยู่ → UPDATE
 * - ถ้า cid ไม่มี → INSERT
 */
exports.upsertPatient = async (req, res) => {
  const {
    cid,
    prename,
    name,
    lname,
    hn,
    sex,
    birth,
    telephone,
  } = req.body;

  if (!cid) {
    return res.status(400).json({
      success: false,
      message: "cid is required",
    });
  }

  try {
    const query = `
      INSERT INTO patients (
        cid, prename, name, lname, hn, sex, birth, telephone
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      ON CONFLICT (cid)
      DO UPDATE SET
        prename   = EXCLUDED.prename,
        name      = EXCLUDED.name,
        lname     = EXCLUDED.lname,
        hn        = EXCLUDED.hn,
        sex       = EXCLUDED.sex,
        birth     = EXCLUDED.birth,
        telephone = EXCLUDED.telephone
      RETURNING *;
    `;

    const values = [
      cid,
      prename,
      name,
      lname,
      hn,
      sex,
      birth,
      telephone,
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("UPSERT PATIENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};
