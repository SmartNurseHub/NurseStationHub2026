/******************************************************************
 * Satisfaction Survey Service (googleapis version)
 ******************************************************************/
const { appendRow, readRows } = require("../../config/google");

const SHEET_NAME = "SatisfactionSurvey";

exports.saveSurvey = async (data) => {

  // 🔹 อ่านข้อมูลทั้งหมด (ใช้เช็คซ้ำ)
  const rows = await readRows(SHEET_NAME);

  // rows[0] = header → ข้าม
  const duplicated = rows.slice(1).find(r => r[1] === data.uid);

  if (duplicated) {
    return { status: "duplicate" };
  }

  // 🔹 เตรียม row ให้ตรงคอลัมน์
  const row = [
    new Date().toISOString(),   // timestamp (A)
    data.uid || "",             // UID (B)
    data.serviceDate || "",     // วันที่รับบริการ
    data.fullName || "",
    data.phone || "",
    data.services || "",
    data.q1 || "",
    data.q2 || "",
    data.q3 || "",
    data.q4 || "",
    data.q5 || "",
    data.q6 || "",
    data.q7 || "",
    data.q8 || "",
    data.q9 || "",
    data.q10 || "",
    data.comment || ""
  ];

  await appendRow(SHEET_NAME, row);

  return { status: "success" };
};
