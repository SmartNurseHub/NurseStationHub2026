const csv = require("csv-parser");
const { Pool } = require("pg");
const stream = require("stream");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.bulkUpsert = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const results = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  try {
    bufferStream
      .pipe(csv())
      .on("data", (row) => {
        if (row.cid) results.push(row);
      })
      .on("end", async () => {
        const client = await pool.connect();
        let count = 0;

        try {
          await client.query("BEGIN");

          for (const p of results) {
            await client.query(
              `
              INSERT INTO patients (
                cid, prename, name, lname, hn, sex, birth, telephone
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
              ON CONFLICT (cid) DO UPDATE SET
                prename = EXCLUDED.prename,
                name = EXCLUDED.name,
                lname = EXCLUDED.lname,
                hn = EXCLUDED.hn,
                sex = EXCLUDED.sex,
                birth = EXCLUDED.birth,
                telephone = EXCLUDED.telephone
              `,
              [
                p.cid,
                p.prename || null,
                p.name || null,
                p.lname || null,
                p.hn || null,
                p.sex || null,
                p.birth || null,
                p.telephone || null,
              ]
            );
            count++;
          }

          await client.query("COMMIT");

          res.json({
            success: true,
            message: "Bulk upsert completed",
            total: count,
          });
        } catch (err) {
          await client.query("ROLLBACK");
          console.error(err);
          res.status(500).json({ success: false, error: err.message });
        } finally {
          client.release();
        }
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
