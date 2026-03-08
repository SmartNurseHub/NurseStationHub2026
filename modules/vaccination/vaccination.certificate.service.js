const PDFDocument = require("pdfkit");

exports.generateCertificate = async(history,patient)=>{

  const doc = new PDFDocument();

  doc.fontSize(20).text("Vaccination Certificate");

  doc.moveDown();

  doc.text(`Name: ${patient.name}`);
  doc.text(`CID: ${patient.cid}`);

  doc.moveDown();

  history.forEach(v=>{
    doc.text(`${v.vaccineCode} Dose ${v.doseNumber} : ${v.vaccineDate}`);
  });

  doc.end();

  return doc;

};